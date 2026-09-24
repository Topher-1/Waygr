import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@/lib/jobs/memory-store';
import { settleGame } from '@/lib/jobs/settle';

const FINAL_GAME = {
  id: 'game-1',
  provider: 'fixture',
  providerGameId: '1',
  league: 'nfl' as const,
  homeTeam: 'nfl:KC',
  awayTeam: 'nfl:BUF',
  startsAt: '2026-09-20T20:25:00.000Z',
  status: 'final' as const,
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
};

function seedWinnerChallenge(store: MemoryStore, state: 'live' | 'settled' = 'live') {
  store.seedProfile({ id: 'creator', jerseyTeam: null, jerseyUntil: null });
  store.seedProfile({ id: 'opponent', jerseyTeam: null, jerseyUntil: null });
  store.seedTeamAbbr('nfl:KC', 'KC');
  store.seedGame(FINAL_GAME);
  store.seedChallenge({
    id: 'c1',
    slug: 'abc123',
    creatorId: 'creator',
    opponentId: 'opponent',
    gameId: 'game-1',
    market: 'winner',
    creatorPick: 'home',
    line: null,
    quarter: null,
    forfeitKind: 'concession',
    forfeitText: null,
    state,
    outcome: state === 'settled' ? 'creator' : null,
    settledAt: state === 'settled' ? '2026-09-20T23:00:00.000Z' : null,
  });
}

describe('atomic settlement', () => {
  it('crash before commit leaves challenge unsettled (no stranded state)', async () => {
    const store = new MemoryStore(new Date('2026-09-20T23:00:00.000Z'));
    seedWinnerChallenge(store);
    store.atomicFailBeforeCommit = true;

    await expect(settleGame(store, 'game-1')).rejects.toThrow('simulated crash');

    const challenge = store.challenges.get('c1')!;
    expect(challenge.state).toBe('live');
    expect(store.forfeits.size).toBe(0);
    expect(store.notifications.size).toBe(0);
  });

  it('repairs settled challenge missing forfeit on retry', async () => {
    const store = new MemoryStore(new Date('2026-09-20T23:00:00.000Z'));
    seedWinnerChallenge(store, 'settled');

    expect(store.forfeits.size).toBe(0);

    await settleGame(store, 'game-1');

    expect(store.challenges.get('c1')?.state).toBe('settled');
    expect(store.forfeits.size).toBe(1);
    expect(store.forfeitsByChallenge.get('c1')?.owedBy).toBe('opponent');
    expect(store.notifications.size).toBe(2);
  });

  it('sequential crash hole is recovered: settled-without-forfeit then atomic retry', async () => {
    const store = new MemoryStore(new Date('2026-09-20T23:00:00.000Z'));
    seedWinnerChallenge(store);

    // Simulate legacy non-atomic partial write: challenge settled, forfeit never created.
    store.challenges.set('c1', {
      ...store.challenges.get('c1')!,
      state: 'settled',
      outcome: 'creator',
      settledAt: '2026-09-20T23:00:00.000Z',
    });
    expect(store.forfeits.size).toBe(0);

    await settleGame(store, 'game-1');

    expect(store.forfeits.size).toBe(1);
    expect(store.notifications.size).toBe(2);
  });
});
