/**
 * Head-to-head record between two people, from settled challenges
 * (BUILD-BRIEF · Definitions, `rivalries` view).
 */

export type SettledPair = {
  creatorId: string;
  opponentId: string | null;
  outcome: "creator" | "opponent" | "push" | null;
  settledAt: string | null;
};

export type HeadToHead = {
  wins: number;
  losses: number;
  pushes: number;
  lastSettledAt: string | null;
};

/** Record from `subjectId`'s point of view against `otherId`. */
export function computeHeadToHead(
  challenges: SettledPair[],
  subjectId: string,
  otherId: string,
): HeadToHead {
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let lastSettledAt: string | null = null;

  for (const challenge of challenges) {
    const ids = [challenge.creatorId, challenge.opponentId];
    if (!ids.includes(subjectId) || !ids.includes(otherId)) continue;
    if (!challenge.outcome) continue;

    if (challenge.outcome === "push") {
      pushes++;
    } else {
      const winnerId =
        challenge.outcome === "creator" ? challenge.creatorId : challenge.opponentId;
      if (winnerId === subjectId) {
        wins++;
      } else {
        losses++;
      }
    }

    if (
      challenge.settledAt &&
      (!lastSettledAt || challenge.settledAt > lastSettledAt)
    ) {
      lastSettledAt = challenge.settledAt;
    }
  }

  return { wins, losses, pushes, lastSettledAt };
}

export type RivalrySummary = HeadToHead & {
  profileId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

/** Busiest rivalries first, then most recent — the Profile "top rivalries" list. */
export function sortRivalries(rivalries: RivalrySummary[]): RivalrySummary[] {
  return [...rivalries].sort((a, b) => {
    const aGames = a.wins + a.losses + a.pushes;
    const bGames = b.wins + b.losses + b.pushes;
    if (aGames !== bGames) return bGames - aGames;
    return (b.lastSettledAt ?? "").localeCompare(a.lastSettledAt ?? "");
  });
}
