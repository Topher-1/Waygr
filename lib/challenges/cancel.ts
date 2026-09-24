export type CancelRejectReason =
  | "unauthorized"
  | "not_found"
  | "not_creator"
  | "not_open";

export type CancelValidationInput = {
  challengeState: string;
  creatorId: string;
  actorProfileId: string;
};

export type CancelValidationResult =
  | { ok: true }
  | { ok: false; reason: CancelRejectReason };

/** Pre-flight checks before canceling a challenge (unit-tested). */
export function validateCancel(
  input: CancelValidationInput,
): CancelValidationResult {
  if (input.actorProfileId !== input.creatorId) {
    return { ok: false, reason: "not_creator" };
  }
  if (input.challengeState !== "open") {
    return { ok: false, reason: "not_open" };
  }
  return { ok: true };
}
