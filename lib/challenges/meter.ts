import type { ChallengeLanding, ChallengeLandingGame } from "@/lib/challenges/types";

export type MeterAhead = "viewer" | "opponent" | "tied";

export type ChallengeMeter = {
  /** Viewer share of the bar, 0–100 (orange = viewer). */
  viewerShare: number;
  ahead: MeterAhead;
  /** Signed margin from the creator's perspective on the call. */
  margin: number;
};

type PeriodScore = ChallengeLandingGame["periodScores"][number];

function scoreThrough(
  periodScores: PeriodScore[],
  last: number,
): { home: number; away: number } {
  return periodScores
    .filter((s) => s.period <= last)
    .reduce(
      (acc, s) => ({ home: acc.home + s.home, away: acc.away + s.away }),
      { home: 0, away: 0 },
    );
}

function sideMargin(
  challenge: ChallengeLanding,
  home: number,
  away: number,
): number {
  const creatorScore =
    challenge.creatorPick === "home" ? home : away;
  const opponentScore =
    challenge.creatorPick === "home" ? away : home;
  return creatorScore - opponentScore;
}

/** Margin on the call; positive means creator is ahead. */
export function computeCallMargin(
  challenge: ChallengeLanding,
  game: ChallengeLandingGame,
): number {
  const line = challenge.line ? parseFloat(challenge.line) : null;
  const { homeScore, awayScore, periodScores, period, status, league } = game;

  switch (challenge.market) {
    case "winner":
      return sideMargin(challenge, homeScore, awayScore);
    case "spread": {
      if (line === null) return 0;
      const mine =
        challenge.creatorPick === "home" ? homeScore : awayScore;
      const theirs =
        challenge.creatorPick === "home" ? awayScore : homeScore;
      return mine + line - theirs;
    }
    case "total": {
      if (line === null) return 0;
      const total = homeScore + awayScore;
      return challenge.creatorPick === "over" ? total - line : line - total;
    }
    case "half_leader": {
      const halfEnds = league === "ncaab" ? 1 : 2;
      const final = status === "final";
      const through =
        final || (status === "live" && (period ?? 0) > halfEnds)
          ? halfEnds
          : Math.min(Math.max(period ?? 1, 1), halfEnds);
      if (periodScores.length > 0) {
        const scores = scoreThrough(periodScores, through);
        return sideMargin(challenge, scores.home, scores.away);
      }
      return sideMargin(challenge, homeScore, awayScore);
    }
    case "quarter_winner": {
      const q = challenge.quarter ?? 1;
      const entry = periodScores.find((s) => s.period === q);
      if (entry) {
        return sideMargin(challenge, entry.home, entry.away);
      }
      return 0;
    }
    default:
      return 0;
  }
}

function meterScale(challenge: ChallengeLanding, game: ChallengeLandingGame): number {
  const line = challenge.line ? Math.abs(parseFloat(challenge.line)) : null;

  switch (challenge.market) {
    case "spread":
      return Math.max((line ?? 3.5) * 2, 7);
    case "total": {
      const total = game.homeScore + game.awayScore;
      const remaining =
        line !== null ? Math.max(Math.abs(line - total), 7) : 14;
      return Math.max(14, remaining);
    }
    case "half_leader":
    case "quarter_winner":
      return 10;
    default:
      return 14;
  }
}

function marginToShare(margin: number, scale: number): number {
  const creatorShare = 0.5 + margin / (2 * scale);
  return Math.max(0.08, Math.min(0.92, creatorShare));
}

/** Challenge meter for the live page (BRAND-BRIEF · 8px bar). */
export function computeChallengeMeter(
  challenge: ChallengeLanding,
  game: ChallengeLandingGame,
  viewerProfileId: string,
): ChallengeMeter {
  const margin = computeCallMargin(challenge, game);
  const viewerIsCreator = viewerProfileId === challenge.creator.id;
  const creatorShare = marginToShare(margin, meterScale(challenge, game));
  const viewerShare = Math.round(
    (viewerIsCreator ? creatorShare : 1 - creatorShare) * 100,
  );

  let ahead: MeterAhead = "tied";
  if (margin > 0) {
    ahead = viewerIsCreator ? "viewer" : "opponent";
  } else if (margin < 0) {
    ahead = viewerIsCreator ? "opponent" : "viewer";
  }

  return { viewerShare, ahead, margin };
}

/** True when live feed is more than 2 minutes stale (BUILD screen rules). */
export function isScoreFeedStale(
  game: ChallengeLandingGame,
  nowMs: number = Date.now(),
): boolean {
  if (game.status !== "live") {
    return false;
  }
  const updatedMs = new Date(game.updatedAt).getTime();
  return nowMs - updatedMs > 2 * 60 * 1000;
}
