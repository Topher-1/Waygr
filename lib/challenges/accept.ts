import type { AcceptRejectReason } from "@/lib/challenges/types";
import { isGameOpenable } from "@/lib/games/openable";

export type AcceptValidationInput = {
  challengeState: string;
  creatorId: string;
  opponentId: string | null;
  gameStatus: string;
  actorProfileId: string;
  adultConfirmedAt: Date | null;
};

export type AcceptValidationResult =
  | { ok: true }
  | { ok: false; reason: AcceptRejectReason };

/** Pre-flight checks before the atomic accept RPC (unit-tested). */
export function validateAccept(
  input: AcceptValidationInput,
): AcceptValidationResult {
  if (!input.adultConfirmedAt) {
    return { ok: false, reason: "adult_required" };
  }

  if (input.actorProfileId === input.creatorId) {
    return { ok: false, reason: "own_challenge" };
  }

  if (!isGameOpenable(input.gameStatus)) {
    return { ok: false, reason: "game_over" };
  }

  if (input.challengeState !== "open") {
    if (input.opponentId && input.opponentId !== input.actorProfileId) {
      return { ok: false, reason: "taken" };
    }
    return { ok: false, reason: "not_open" };
  }

  if (input.opponentId !== null) {
    return { ok: false, reason: "taken" };
  }

  return { ok: true };
}

/**
 * Simulates two simultaneous accepts — exactly one should win (BUILD acceptance).
 */
export function simulateAcceptRace(
  attempts: { profileId: string; adultConfirmedAt: Date }[],
  challenge: {
    state: string;
    creatorId: string;
    opponentId: string | null;
    gameStatus: string;
  },
): { winner: string | null; losers: string[] } {
  let opponentId: string | null = challenge.opponentId;
  let state = challenge.state;
  let winner: string | null = null;
  const losers: string[] = [];

  for (const attempt of attempts) {
    const result = validateAccept({
      challengeState: state,
      creatorId: challenge.creatorId,
      opponentId,
      gameStatus: challenge.gameStatus,
      actorProfileId: attempt.profileId,
      adultConfirmedAt: attempt.adultConfirmedAt,
    });

    if (!result.ok) {
      losers.push(attempt.profileId);
      continue;
    }

    if (state === "open" && opponentId === null) {
      opponentId = attempt.profileId;
      state = "accepted";
      winner = attempt.profileId;
    } else {
      losers.push(attempt.profileId);
    }
  }

  return { winner, losers };
}
