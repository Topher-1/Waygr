import { settle } from '@/lib/settle';
import { gameRowToSettleGame, isVoidStatus } from '@/lib/jobs/game-state';
import type {
  ChallengeRow,
  ForfeitRow,
  GameRow,
  NotificationRow,
  ProfileRow,
  SettleResult,
} from '@/lib/jobs/types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface SettleStore {
  getGame(id: string): Promise<GameRow | undefined>;
  listChallengesForGame(gameId: string, states: string[]): Promise<ChallengeRow[]>;
  updateChallenge(
    id: string,
    patch: Partial<ChallengeRow>,
    onlyIfStateIn: string[],
  ): Promise<ChallengeRow | null>;
  getForfeitByChallenge(challengeId: string): Promise<ForfeitRow | undefined>;
  insertForfeit(row: Omit<ForfeitRow, 'id'>): Promise<ForfeitRow>;
  insertNotification(row: Omit<NotificationRow, 'sentAt'>): Promise<NotificationRow | null>;
  updateProfile(id: string, patch: Partial<ProfileRow>): Promise<void>;
  getTeamAbbr(teamCode: string): Promise<string>;
}

function loserAndWinner(challenge: ChallengeRow, outcome: 'creator' | 'opponent'): {
  loserId: string;
  winnerId: string;
} {
  const winnerId = outcome === 'creator' ? challenge.creatorId : challenge.opponentId!;
  const loserId = outcome === 'creator' ? challenge.opponentId! : challenge.creatorId;
  return { loserId, winnerId };
}

async function queueSettledNotification(
  store: SettleStore,
  challenge: ChallengeRow,
): Promise<boolean> {
  const participants = [challenge.creatorId, challenge.opponentId].filter(Boolean) as string[];
  let queued = 0;
  for (const userId of participants) {
    const row = await store.insertNotification({
      userId,
      kind: 'settled',
      refId: challenge.id,
    });
    if (row) queued++;
  }
  return queued > 0;
}

async function createForfeit(
  store: SettleStore,
  challenge: ChallengeRow,
  outcome: 'creator' | 'opponent',
  settledAt: string,
): Promise<ForfeitRow> {
  const { loserId, winnerId } = loserAndWinner(challenge, outcome);
  const dueAt = new Date(new Date(settledAt).getTime() + SEVEN_DAYS_MS).toISOString();
  const isJersey = challenge.forfeitKind === 'jersey_swap';

  const forfeit = await store.insertForfeit({
    challengeId: challenge.id,
    owedBy: loserId,
    owedTo: winnerId,
    kind: challenge.forfeitKind,
    status: isJersey ? 'paid' : 'owed',
    dueAt,
    paidAt: isJersey ? settledAt : null,
  });

  if (isJersey) {
    const loserPick = outcome === 'creator' ? challenge.creatorPick : invertPick(challenge.creatorPick);
    const game = await store.getGame(challenge.gameId);
    const teamCode = loserPick === 'home' ? game?.homeTeam : game?.awayTeam;
    const abbr = teamCode ? await store.getTeamAbbr(teamCode) : null;
    if (abbr) {
      await store.updateProfile(loserId, {
        jerseyTeam: abbr,
        jerseyUntil: dueAt,
      });
    }
  }

  return forfeit;
}

function invertPick(pick: ChallengeRow['creatorPick']): 'home' | 'away' {
  if (pick === 'home') return 'away';
  if (pick === 'away') return 'home';
  return 'home';
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

  const challenges = await store.listChallengesForGame(gameId, ['accepted', 'live']);
  const settledAt = now.toISOString();
  const gameStarted =
    game.status === 'live' || game.status === 'final' || new Date(game.startsAt) <= now;

  for (const challenge of challenges) {
    if (challenge.state === 'accepted' && gameStarted && game.status !== 'scheduled') {
      const updated = await store.updateChallenge(challenge.id, { state: 'live' }, ['accepted']);
      if (updated) result.movedToLive++;
    }
  }

  const active = await store.listChallengesForGame(gameId, ['accepted', 'live']);

  for (const challenge of active) {
    if (isVoidStatus(game.status)) {
      const updated = await store.updateChallenge(
        challenge.id,
        { state: 'void', outcome: null, settledAt: null },
        ['accepted', 'live'],
      );
      if (updated) result.voided++;
      continue;
    }

    const outcome = settle(
      {
        market: challenge.market,
        creatorPick: challenge.creatorPick,
        line: challenge.line,
        quarter: challenge.quarter,
      },
      gameRowToSettleGame(game),
    );

    if (outcome === null) continue;

    const updated = await store.updateChallenge(
      challenge.id,
      { state: 'settled', outcome, settledAt },
      ['accepted', 'live'],
    );
    if (!updated) continue;

    result.settled++;

    if (outcome !== 'push') {
      const existing = await store.getForfeitByChallenge(challenge.id);
      if (!existing) {
        await createForfeit(store, challenge, outcome, settledAt);
      }
    }

    if (await queueSettledNotification(store, challenge)) {
      result.notificationsQueued++;
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
