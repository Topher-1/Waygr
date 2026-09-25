/**
 * Forfeit reads for the /f/[id] screen and the forfeit API routes.
 * Service role, then the caller checks the viewer is one of the two parties —
 * clients never write forfeits (BUILD · RLS).
 */
import { createServiceClient } from "@/lib/supabase/service";
import { getChallengeBySlug } from "@/lib/challenges/queries";
import type { ChallengeLanding } from "@/lib/challenges/types";
import type { ForfeitKind, ForfeitStatus } from "@/lib/jobs/types";

export type ForfeitRecord = {
  id: string;
  challengeId: string;
  challengeSlug: string;
  owedBy: string;
  owedTo: string;
  kind: ForfeitKind;
  status: ForfeitStatus;
  proofPath: string | null;
  proofSubmittedAt: string | null;
  proofRejectedAt: string | null;
  dueAt: string;
  paidAt: string | null;
};

export type ForfeitDetail = ForfeitRecord & {
  challenge: ChallengeLanding;
  owedByName: string;
  owedToName: string;
};

type ForfeitRow = {
  id: string;
  challenge_id: string;
  owed_by: string;
  owed_to: string;
  kind: ForfeitKind;
  status: ForfeitStatus;
  proof_path: string | null;
  proof_submitted_at: string | null;
  proof_rejected_at: string | null;
  due_at: string;
  paid_at: string | null;
  challenge: { slug: string } | { slug: string }[] | null;
};

const FORFEIT_COLUMNS = `
  id,
  challenge_id,
  owed_by,
  owed_to,
  kind,
  status,
  proof_path,
  proof_submitted_at,
  proof_rejected_at,
  due_at,
  paid_at,
  challenge:challenges!inner ( slug )
`;

function mapForfeit(row: ForfeitRow): ForfeitRecord | null {
  const challengeRaw = row.challenge;
  const challenge = Array.isArray(challengeRaw) ? challengeRaw[0] : challengeRaw;
  if (!challenge) return null;

  return {
    id: row.id,
    challengeId: row.challenge_id,
    challengeSlug: challenge.slug,
    owedBy: row.owed_by,
    owedTo: row.owed_to,
    kind: row.kind,
    status: row.status,
    proofPath: row.proof_path,
    proofSubmittedAt: row.proof_submitted_at,
    proofRejectedAt: row.proof_rejected_at,
    dueAt: row.due_at,
    paidAt: row.paid_at,
  };
}

/** Raw forfeit row by id, or null. */
export async function getForfeitRecord(
  forfeitId: string,
): Promise<ForfeitRecord | null> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("forfeits")
    .select(FORFEIT_COLUMNS)
    .eq("id", forfeitId)
    .maybeSingle();

  if (error || !data) return null;
  return mapForfeit(data as unknown as ForfeitRow);
}

/** Forfeit row for a challenge, used by the settled challenge view. */
export async function getForfeitForChallenge(
  challengeId: string,
): Promise<ForfeitRecord | null> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("forfeits")
    .select(FORFEIT_COLUMNS)
    .eq("challenge_id", challengeId)
    .maybeSingle();

  if (error || !data) return null;
  return mapForfeit(data as unknown as ForfeitRow);
}

/** Forfeit plus the challenge and both display names, for /f/[id]. */
export async function getForfeitDetail(
  forfeitId: string,
): Promise<ForfeitDetail | null> {
  const record = await getForfeitRecord(forfeitId);
  if (!record) return null;

  const challenge = await getChallengeBySlug(record.challengeSlug);
  if (!challenge) return null;

  const service = createServiceClient();
  const { data: profiles } = await service
    .from("profiles")
    .select("id, display_name")
    .in("id", [record.owedBy, record.owedTo]);

  const names = new Map(
    (profiles ?? []).map((row) => [row.id as string, row.display_name as string]),
  );

  return {
    ...record,
    challenge,
    owedByName: names.get(record.owedBy) ?? "They",
    owedToName: names.get(record.owedTo) ?? "They",
  };
}

/** One-hour signed URL for private proof (BUILD · Storage). */
export async function signProofUrl(
  proofPath: string,
): Promise<string | null> {
  const service = createServiceClient();
  const { data, error } = await service.storage
    .from("proof")
    .createSignedUrl(proofPath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}
