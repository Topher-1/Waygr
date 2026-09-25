/**
 * Profile numbers (BUILD-BRIEF · Profile): record, forfeit paid rate, "Owes N".
 * Pure so the page and the tests share one definition.
 */
import type { ForfeitStatus } from "@/lib/jobs/types";

export type ProfileChallenge = {
  creatorId: string;
  opponentId: string | null;
  outcome: "creator" | "opponent" | "push" | null;
  state: string;
};

export type ProfileForfeit = {
  owedBy: string;
  status: ForfeitStatus;
};

export type ProfileStats = {
  wins: number;
  losses: number;
  pushes: number;
  /** Share of this person's forfeits that are settled, 0–1, or null if none. */
  forfeitPaidRate: number | null;
  forfeitsPaid: number;
  forfeitsTotal: number;
  /** Forfeits still on the hook — the "Owes N" chip. */
  owes: number;
};

export function computeProfileStats(
  challenges: ProfileChallenge[],
  forfeits: ProfileForfeit[],
  profileId: string,
): ProfileStats {
  let wins = 0;
  let losses = 0;
  let pushes = 0;

  for (const challenge of challenges) {
    if (challenge.state !== "settled" || !challenge.outcome) continue;
    const isParticipant =
      challenge.creatorId === profileId || challenge.opponentId === profileId;
    if (!isParticipant) continue;

    if (challenge.outcome === "push") {
      pushes++;
      continue;
    }

    const winnerId =
      challenge.outcome === "creator" ? challenge.creatorId : challenge.opponentId;
    if (winnerId === profileId) {
      wins++;
    } else {
      losses++;
    }
  }

  const owned = forfeits.filter((forfeit) => forfeit.owedBy === profileId);
  const paid = owned.filter((forfeit) => forfeit.status === "paid").length;
  const owes = owned.length - paid;

  return {
    wins,
    losses,
    pushes,
    forfeitPaidRate: owned.length === 0 ? null : paid / owned.length,
    forfeitsPaid: paid,
    forfeitsTotal: owned.length,
    owes,
  };
}

/** "80%" / "—" for the profile stat block. */
export function formatPaidRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}
