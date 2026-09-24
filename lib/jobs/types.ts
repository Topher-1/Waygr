import type { GameStatus, Market, Outcome, Pick } from '@/lib/settle';
import type { League } from '@/lib/scores/types';

export type ChallengeState =
  | 'open'
  | 'accepted'
  | 'live'
  | 'settled'
  | 'void'
  | 'expired'
  | 'canceled';

export type ForfeitKind = 'concession' | 'jersey_swap' | 'custom';
export type ForfeitStatus = 'owed' | 'proof_submitted' | 'paid';

export interface GameRow {
  id: string;
  provider: string;
  providerGameId: string;
  league: League;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  status: GameStatus;
  period: number | null;
  clock: string | null;
  homeScore: number;
  awayScore: number;
  periodScores: { period: number; home: number; away: number }[];
  updatedAt: string;
}

export interface ChallengeRow {
  id: string;
  slug: string;
  creatorId: string;
  opponentId: string | null;
  gameId: string;
  market: Market;
  creatorPick: Pick;
  line: number | null;
  quarter: number | null;
  forfeitKind: ForfeitKind;
  forfeitText: string | null;
  state: ChallengeState;
  outcome: Outcome | null;
  settledAt: string | null;
}

export interface ForfeitRow {
  id: string;
  challengeId: string;
  owedBy: string;
  owedTo: string;
  kind: ForfeitKind;
  status: ForfeitStatus;
  dueAt: string;
  paidAt: string | null;
}

export interface NotificationRow {
  userId: string;
  kind: string;
  refId: string;
  sentAt: string;
}

export interface ProfileRow {
  id: string;
  jerseyTeam: string | null;
  jerseyUntil: string | null;
}

export interface PollScoresResult {
  updatedGameIds: string[];
  scheduleRefreshed: boolean;
}

export interface SettleResult {
  settled: number;
  voided: number;
  movedToLive: number;
  notificationsQueued: number;
}

export interface SweepResult {
  expired: number;
  voided: number;
  proofsConfirmed: number;
  jerseysEnded: number;
}
