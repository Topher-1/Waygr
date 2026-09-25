import type { Game } from '@/lib/settle.ts';
import type { GameRow } from '@/lib/jobs/types.ts';

export function gameRowToSettleGame(row: GameRow): Game {
  return {
    league: row.league,
    status: row.status,
    period: row.period,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    periodScores: row.periodScores,
  };
}

export function isVoidStatus(status: Game['status']): boolean {
  return status === 'postponed' || status === 'suspended' || status === 'canceled';
}
