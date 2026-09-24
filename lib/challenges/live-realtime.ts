import type { ChallengeLandingGame } from "@/lib/challenges/types";

type GameRow = {
  id: string;
  status: string;
  period: number | null;
  clock: string | null;
  home_score: number;
  away_score: number;
  period_scores: { period: number; home: number; away: number }[] | null;
  updated_at: string;
};

type ChallengeRow = {
  state: string;
  outcome: string | null;
  settled_at: string | null;
};

export function mapRealtimeGameRow(
  row: GameRow,
  base: ChallengeLandingGame,
): ChallengeLandingGame {
  return {
    ...base,
    status: row.status,
    period: row.period,
    clock: row.clock,
    homeScore: row.home_score,
    awayScore: row.away_score,
    periodScores: row.period_scores ?? base.periodScores,
    updatedAt: row.updated_at,
  };
}

export function mapRealtimeChallengeRow(row: ChallengeRow): {
  state: string;
  outcome: string | null;
  settledAt: string | null;
} {
  return {
    state: row.state,
    outcome: row.outcome,
    settledAt: row.settled_at,
  };
}
