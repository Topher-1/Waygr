import { settle, type Outcome } from '@/lib/settle.ts';
import { gameRowToSettleGame, isVoidStatus } from '@/lib/jobs/game-state.ts';
import { buildAtomicSettleParams } from '@/lib/jobs/settle-params.ts';
import type {
  AtomicSettleParams,
  AtomicSettleResult,
  ChallengeRow,
  GameRow,
  SettleResult,
} from '@/lib/jobs/types.ts';

export interface SettleStore {
  getGame(id: string): Promise<GameRow | undefined>;
  listChallengesForSettlement(gameId: string): Promise<ChallengeRow[]>;
  moveChallengeToLive(challengeId: string): Promise<boolean>;
  voidChallenge(challengeId: string): Promise<boolean>;
  settleChallengeAtomic(params: AtomicSettleParams): Promise<AtomicSettleResult>;
  getTeamAbbr(teamCode: string): Promise<string>;
}

export async function settleGame(
  store: SettleStore,
  gameId: string,
  now = new Date(),
): Promise<SettleResult> {
  const game = await store.getGame(gameId);
  if (!game) {
    return { settled: 0, voided: 0, movedToLive: 0, notificationsQueued: 0 };
  }

  const result: SettleResult = {
    settled: 0,
    voided: 0,
    movedToLive: 0,
    notificationsQueued: 0,
  };

  const settledAt = now.toISOString();
  const gameStarted =
    game.status === 'live' || game.status === 'final' || new Date(game.startsAt) <= now;

  const challenges = await store.listChallengesForSettlement(gameId);

  for (const challenge of challenges) {
    if (challenge.state === 'accepted' && gameStarted && game.status !== 'scheduled') {
      if (await store.moveChallengeToLive(challenge.id)) {
        result.movedToLive++;
      }
    }
  }

  const active = await store.listChallengesForSettlement(gameId);

  for (const challenge of active) {
    if (challenge.state !== 'settled' && isVoidStatus(game.status)) {
      if (await store.voidChallenge(challenge.id)) {
        result.voided++;
      }
      continue;
    }

    let outcome: Outcome | null;
    if (challenge.state === 'settled') {
      outcome = challenge.outcome;
    } else {
      outcome = settle(
        {
          market: challenge.market,
          creatorPick: challenge.creatorPick,
          line: challenge.line,
          quarter: challenge.quarter,
        },
        gameRowToSettleGame(game),
      );
    }

    if (outcome === null) continue;

    const params = await buildAtomicSettleParams(
      challenge,
      game,
      outcome,
      challenge.settledAt ?? settledAt,
      (code) => store.getTeamAbbr(code),
    );

    const atomic = await store.settleChallengeAtomic(params);
    if (atomic.settled && !atomic.repaired) {
      result.settled++;
    }
    if (atomic.notificationsQueued > 0) {
      result.notificationsQueued += atomic.notificationsQueued;
    }
  }

  return result;
}

export async function settleGames(
  store: SettleStore,
  gameIds: string[],
  now = new Date(),
): Promise<SettleResult> {
  const totals: SettleResult = {
    settled: 0,
    voided: 0,
    movedToLive: 0,
    notificationsQueued: 0,
  };

  for (const gameId of gameIds) {
    const r = await settleGame(store, gameId, now);
    totals.settled += r.settled;
    totals.voided += r.voided;
    totals.movedToLive += r.movedToLive;
    totals.notificationsQueued += r.notificationsQueued;
  }

  return totals;
}
