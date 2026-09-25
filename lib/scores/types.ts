import type { GameStatus } from '@/lib/settle.ts';

export type League = 'nfl' | 'ncaaf' | 'nba' | 'ncaab' | 'mlb';

export type PeriodScore = { period: number; home: number; away: number };

export interface GameUpsert {
  providerGameId: string;
  league: League;
  homeTeamCode: string;
  awayTeamCode: string;
  startsAt: Date;
  status: GameStatus;
  period: number | null;
  clock: string | null;
  homeScore: number;
  awayScore: number;
  periodScores: PeriodScore[];
}

export interface GameUpdate {
  providerGameId: string;
  status: GameStatus;
  period: number | null;
  clock: string | null;
  homeScore: number;
  awayScore: number;
  periodScores: PeriodScore[];
}

export interface ScoreProvider {
  readonly name: string;
  listGames(league: League, from: Date, to: Date): Promise<GameUpsert[]>;
  getLive(providerGameIds: string[]): Promise<GameUpdate[]>;
}
