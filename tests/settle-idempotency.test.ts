import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@/lib/jobs/memory-store';
import { settleGame } from '@/lib/jobs/settle';

describe('settle idempotency', () => {
  it('running settle twice creates no duplicate forfeits or notifications', async () => {
    const store = new MemoryStore(new Date('2026-09-20T23:00:00.000Z'));
    const gameId = 'game-1';

    store.seedGame({
      id: gameId,
      provider: 'fixture',
      providerGameId: '1',
      league: 'nfl',
      homeTeam: 'nfl:KC',
      awayTeam: 'nfl:BUF',
      startsAt: '2026-09-20T20:25:00.000Z',
      status: 'final',
      period: 4,
      clock: null,
      homeScore: 27,
      awayScore: 20,
      periodScores: [
        { period: 1, home: 7, away: 3 },
        { period: 2, home: 10, away: 7 },
        { period: 3, home: 3, away: 7 },
        { period: 4, home: 7, away: 3 },
      ],
      updatedAt: '2026-09-20T23:00:00.000Z',
    });

    store.seedProfile({ id: 'creator', jerseyTeam: null, jerseyUntil: null });
    store.seedProfile({ id: 'opponent', jerseyTeam: null, jerseyUntil: null });
    store.seedTeamAbbr('nfl:KC', 'KC');

    store.seedChallenge({
      id: 'c1',
      slug: 'abc123',
      creatorId: 'creator',
      opponentId: 'opponent',
      gameId,
      market: 'winner',
      creatorPick: 'home',
      line: null,
      quarter: null,
      forfeitKind: 'jersey_swap',
      forfeitText: null,
      state: 'live',
      outcome: null,
      settledAt: null,
    });

    const first = await settleGame(store, gameId);
    expect(first.settled).toBe(1);
    expect(store.forfeits.size).toBe(1);
    expect(store.notifications.size).toBe(2);

    const second = await settleGame(store, gameId);
    expect(second.settled).toBe(0);
    expect(store.forfeits.size).toBe(1);
    expect(store.notifications.size).toBe(2);
  });
});
