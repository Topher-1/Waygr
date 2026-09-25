/**
 * Forfeit writes. Service role only, guarded by the pure rules in
 * `lib/forfeits/actions.ts`; every write is a conditional update so a repeated
 * call (share sheet resolving twice, sweep racing the winner) is a no-op.
 */
import { createServiceClient } from "@/lib/supabase/service";
import {
  canMarkDone,
  canReviewProof,
  canSubmitProof,
  checkProofUpload,
  proofObjectPath,
} from "@/lib/forfeits/actions";
import { getForfeitRecord, type ForfeitRecord } from "@/lib/forfeits/queries";

export type ForfeitMutationFailure =
  | "not_found"
  | "not_party"
  | "wrong_state"
  | "mime"
  | "size"
  | "storage";

export type ForfeitMutationResult<T = ForfeitRecord> =
  | { ok: true; value: T }
  | { ok: false; reason: ForfeitMutationFailure };

async function loadForParty(
  forfeitId: string,
  viewerProfileId: string,
): Promise<ForfeitMutationResult> {
  const record = await getForfeitRecord(forfeitId);
  if (!record) return { ok: false, reason: "not_found" };
  if (record.owedBy !== viewerProfileId && record.owedTo !== viewerProfileId) {
    return { ok: false, reason: "not_party" };
  }
  return { ok: true, value: record };
}

/**
 * Loser marks honor-system done (BUILD · POST /api/forfeits/[id]/paid).
 * Sets proof_submitted — winner still confirms (or sweep auto-confirms after 72h).
 */
export async function markForfeitPaid(
  forfeitId: string,
  viewerProfileId: string,
  now = new Date(),
): Promise<ForfeitMutationResult> {
  const loaded = await loadForParty(forfeitId, viewerProfileId);
  if (!loaded.ok) return loaded;

  const record = loaded.value;
  if (record.status === "paid") {
    return { ok: true, value: record };
  }
  if (record.status === "proof_submitted") {
    return { ok: true, value: record };
  }
  if (!canMarkDone(record, viewerProfileId)) {
    return { ok: false, reason: "wrong_state" };
  }

  const service = createServiceClient();
  const { data } = await service
    .from("forfeits")
    .update({
      status: "proof_submitted",
      proof_submitted_at: now.toISOString(),
      proof_rejected_at: null,
    })
    .eq("id", forfeitId)
    .eq("status", "owed")
    .select("id")
    .maybeSingle();

  if (!data) {
    const refreshed = await getForfeitRecord(forfeitId);
    if (refreshed?.status === "proof_submitted" || refreshed?.status === "paid") {
      return { ok: true, value: refreshed };
    }
    return { ok: false, reason: "wrong_state" };
  }

  return {
    ok: true,
    value: {
      ...record,
      status: "proof_submitted",
      proofSubmittedAt: now.toISOString(),
      proofRejectedAt: null,
    },
  };
}

export type ProofUpload = { uploadUrl: string; token: string; path: string };

/** Hand the loser a short-lived signed upload URL for the private bucket. */
export async function createProofUpload(
  forfeitId: string,
  viewerProfileId: string,
  request: { contentType: string; size: number },
): Promise<ForfeitMutationResult<ProofUpload>> {
  const loaded = await loadForParty(forfeitId, viewerProfileId);
  if (!loaded.ok) return loaded;
  if (!canSubmitProof(loaded.value, viewerProfileId)) {
    return { ok: false, reason: "wrong_state" };
  }

  const check = checkProofUpload(request);
  if (!check.ok) {
    return { ok: false, reason: check.reason };
  }

  const path = proofObjectPath(forfeitId, request.contentType);
  const service = createServiceClient();
  const { data, error } = await service.storage
    .from("proof")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return { ok: false, reason: "storage" };
  }

  return {
    ok: true,
    value: { uploadUrl: data.signedUrl, token: data.token, path },
  };
}

/** Custom forfeit: proof landed in Storage, so the winner gets to look. */
export async function submitProof(
  forfeitId: string,
  viewerProfileId: string,
  proofPath: string,
  now = new Date(),
): Promise<ForfeitMutationResult> {
  const loaded = await loadForParty(forfeitId, viewerProfileId);
  if (!loaded.ok) return loaded;
  if (!canSubmitProof(loaded.value, viewerProfileId)) {
    return { ok: false, reason: "wrong_state" };
  }
  if (!proofPath.startsWith(`${forfeitId}/`)) {
    return { ok: false, reason: "not_party" };
  }

  const service = createServiceClient();
  const { data } = await service
    .from("forfeits")
    .update({
      status: "proof_submitted",
      proof_path: proofPath,
      proof_submitted_at: now.toISOString(),
      proof_rejected_at: null,
    })
    .eq("id", forfeitId)
    .eq("status", "owed")
    .select("id")
    .maybeSingle();

  if (!data) return { ok: false, reason: "wrong_state" };

  return {
    ok: true,
    value: {
      ...loaded.value,
      status: "proof_submitted",
      proofPath,
      proofSubmittedAt: now.toISOString(),
      proofRejectedAt: null,
    },
  };
}

/** Winner confirms the proof. The sweep job does the same after 72 hours. */
export async function confirmProof(
  forfeitId: string,
  viewerProfileId: string,
  now = new Date(),
): Promise<ForfeitMutationResult> {
  const loaded = await loadForParty(forfeitId, viewerProfileId);
  if (!loaded.ok) return loaded;
  if (!canReviewProof(loaded.value, viewerProfileId)) {
    return { ok: false, reason: "wrong_state" };
  }

  const service = createServiceClient();
  const { data } = await service
    .from("forfeits")
    .update({ status: "paid", paid_at: now.toISOString() })
    .eq("id", forfeitId)
    .eq("status", "proof_submitted")
    .select("id")
    .maybeSingle();

  if (!data) return { ok: false, reason: "wrong_state" };

  return {
    ok: true,
    value: { ...loaded.value, status: "paid", paidAt: now.toISOString() },
  };
}

/** Winner rejects: back to owed, and the auto-confirm clock stops. */
export async function rejectProof(
  forfeitId: string,
  viewerProfileId: string,
  now = new Date(),
): Promise<ForfeitMutationResult> {
  const loaded = await loadForParty(forfeitId, viewerProfileId);
  if (!loaded.ok) return loaded;
  if (!canReviewProof(loaded.value, viewerProfileId)) {
    return { ok: false, reason: "wrong_state" };
  }

  const service = createServiceClient();
  const { data } = await service
    .from("forfeits")
    .update({
      status: "owed",
      proof_submitted_at: null,
      proof_rejected_at: now.toISOString(),
    })
    .eq("id", forfeitId)
    .eq("status", "proof_submitted")
    .select("id")
    .maybeSingle();

  if (!data) return { ok: false, reason: "wrong_state" };

  return {
    ok: true,
    value: {
      ...loaded.value,
      status: "owed",
      proofSubmittedAt: null,
      proofRejectedAt: now.toISOString(),
    },
  };
}
