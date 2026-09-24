import type { ChallengeLanding, ChallengeView } from "@/lib/challenges/types";

/**
 * Maps challenge state + viewer to one of five landing views (BUILD-BRIEF).
 */
export function resolveChallengeView(
  challenge: ChallengeLanding,
  viewerProfileId: string | null,
): ChallengeView {
  const kickoffPassed = new Date(challenge.game.startsAt) <= new Date();

  if (
    challenge.state === "void" ||
    challenge.state === "canceled" ||
    challenge.state === "expired" ||
    (challenge.state === "open" && kickoffPassed)
  ) {
    return "void";
  }

  if (challenge.state === "settled") {
    return "settled";
  }

  if (challenge.state === "live" || challenge.state === "accepted") {
    const isParticipant =
      viewerProfileId !== null &&
      (viewerProfileId === challenge.creator.id ||
        viewerProfileId === challenge.opponent?.id);

    if (isParticipant) {
      return "live";
    }
    return "taken";
  }

  if (challenge.state === "open") {
    if (
      challenge.opponent !== null &&
      viewerProfileId !== challenge.opponent.id
    ) {
      return "taken";
    }
    return "open";
  }

  return "void";
}

/** Void reason copy key for the void view. */
export function voidReason(challenge: ChallengeLanding): string {
  if (challenge.state === "expired" || challenge.state === "open") {
    return "expired";
  }
  if (challenge.game.status === "postponed") {
    return "postponed";
  }
  if (challenge.game.status === "canceled") {
    return "canceled";
  }
  if (challenge.game.status === "suspended") {
    return "suspended";
  }
  return "void";
}
