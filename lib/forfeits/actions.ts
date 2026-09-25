/**
 * Forfeit lifecycle rules (BUILD-BRIEF · Routes and jobs, Screens and flows).
 * Honor-system completion: `paid` only after loser marks done AND winner confirms
 * (or 72 h auto-confirm). Jersey-swap stays auto-paid on settle.
 */
import type { ForfeitKind, ForfeitStatus } from "@/lib/jobs/types";

export const PROOF_AUTO_CONFIRM_MS = 72 * 60 * 60 * 1000;

/** Storage limits for the private `proof` bucket (BUILD · Storage). */
export const MAX_PROOF_BYTES = 50 * 1024 * 1024;
export const PROOF_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;
export const MAX_PROOF_VIDEO_SECONDS = 30;

export type ForfeitRole = "loser" | "winner";

export type ForfeitActor = {
  owedBy: string;
  owedTo: string;
};

/** Which side of the forfeit the viewer is on, or null if neither. */
export function resolveForfeitRole(
  forfeit: ForfeitActor,
  viewerProfileId: string | null,
): ForfeitRole | null {
  if (!viewerProfileId) return null;
  if (viewerProfileId === forfeit.owedBy) return "loser";
  if (viewerProfileId === forfeit.owedTo) return "winner";
  return null;
}

export type ForfeitState = ForfeitActor & {
  kind: ForfeitKind;
  status: ForfeitStatus;
};

/** Loser may share the concession card while still owed. */
export function canShareConcession(
  forfeit: ForfeitState,
  viewerProfileId: string | null,
): boolean {
  return (
    resolveForfeitRole(forfeit, viewerProfileId) === "loser" &&
    forfeit.status === "owed" &&
    forfeit.kind === "concession"
  );
}

/** Loser may mark honor-system done (concession or custom without proof yet). */
export function canMarkDone(
  forfeit: ForfeitState,
  viewerProfileId: string | null,
): boolean {
  return (
    resolveForfeitRole(forfeit, viewerProfileId) === "loser" &&
    forfeit.status === "owed" &&
    forfeit.kind !== "jersey_swap"
  );
}

/** Loser may upload custom proof while the forfeit is still owed. */
export function canSubmitProof(
  forfeit: ForfeitState,
  viewerProfileId: string | null,
): boolean {
  return (
    resolveForfeitRole(forfeit, viewerProfileId) === "loser" &&
    forfeit.status === "owed" &&
    forfeit.kind === "custom"
  );
}

/** Winner confirms or rejects a loser mark or custom proof. */
export function canReviewProof(
  forfeit: ForfeitState,
  viewerProfileId: string | null,
): boolean {
  return (
    resolveForfeitRole(forfeit, viewerProfileId) === "winner" &&
    forfeit.status === "proof_submitted"
  );
}

/** Loser is waiting on the winner after marking done. */
export function isAwaitingWinnerConfirm(
  forfeit: ForfeitState,
  viewerProfileId: string | null,
): boolean {
  return (
    resolveForfeitRole(forfeit, viewerProfileId) === "loser" &&
    forfeit.status === "proof_submitted"
  );
}

/** Auto-confirm 72 hours after the loser mark or proof upload (BUILD · sweep). */
export function isProofAutoConfirmDue(
  submittedAt: string | Date,
  now: Date,
): boolean {
  const submitted =
    submittedAt instanceof Date ? submittedAt : new Date(submittedAt);
  return now.getTime() - submitted.getTime() >= PROOF_AUTO_CONFIRM_MS;
}

/** Hours left before auto-confirm. */
export function hoursUntilAutoConfirm(
  submittedAt: string | Date,
  now: Date,
): number {
  const submitted =
    submittedAt instanceof Date ? submittedAt : new Date(submittedAt);
  const remaining =
    PROOF_AUTO_CONFIRM_MS - (now.getTime() - submitted.getTime());
  return Math.max(0, Math.ceil(remaining / (60 * 60 * 1000)));
}

export type ProofUploadRequest = {
  contentType: string;
  size: number;
};

export type ProofUploadCheck =
  | { ok: true }
  | { ok: false; reason: "mime" | "size" };

/** Gate uploads before we hand out a signed upload URL. */
export function checkProofUpload(request: ProofUploadRequest): ProofUploadCheck {
  if (!(PROOF_MIME_TYPES as readonly string[]).includes(request.contentType)) {
    return { ok: false, reason: "mime" };
  }
  if (!Number.isFinite(request.size) || request.size <= 0 || request.size > MAX_PROOF_BYTES) {
    return { ok: false, reason: "size" };
  }
  return { ok: true };
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/** Storage object path, namespaced by forfeit. */
export function proofObjectPath(
  forfeitId: string,
  contentType: string,
  stamp = Date.now(),
): string {
  const ext = MIME_EXTENSIONS[contentType] ?? "bin";
  return `${forfeitId}/${stamp}.${ext}`;
}

/** Jersey frame runs for 7 days from settlement (BUILD · Settlement). */
export function isJerseyActive(
  profile: { jerseyTeam: string | null; jerseyUntil: string | Date | null },
  now: Date,
): boolean {
  if (!profile.jerseyTeam || !profile.jerseyUntil) return false;
  const until =
    profile.jerseyUntil instanceof Date
      ? profile.jerseyUntil
      : new Date(profile.jerseyUntil);
  return until.getTime() > now.getTime();
}

/** Whole days of jersey time left, rounded up. */
export function jerseyDaysRemaining(
  profile: { jerseyTeam: string | null; jerseyUntil: string | Date | null },
  now: Date,
): number {
  if (!isJerseyActive(profile, now)) return 0;
  const until = new Date(profile.jerseyUntil as string | Date);
  return Math.ceil((until.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}
