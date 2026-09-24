import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@/lib/jobs/memory-store';
import { runSweep } from '@/lib/jobs/sweep';

describe('sweep', () => {
  it('expires open challenges past kickoff', async () => {
    const now = new Date('2026-09-20T21:00:00.000Z');
    const store = new MemoryStore(now);

    store.seedGame({
      id: 'g1',
      provider: 'fixture',
      providerGameId: '1',
      league: 'nfl',
      homeTeam: 'nfl:KC',
      awayTeam: 'nfl:BUF',
      startsAt: '2026-09-20T20:25:00.000Z',
      status: 'live',
      period: 1,
      clock: null,
      homeScore: 0,
      awayScore: 0,
      periodScores: [],
      updatedAt: now.toISOString(),
    });

    store.seedChallenge({
      id: 'open-1',
      slug: 'open1',
      creatorId: 'c',
      opponentId: null,
      gameId: 'g1',
      market: 'winner',
      creatorPick: 'home',
      line: null,
      quarter: null,
      forfeitKind: 'concession',
      forfeitText: null,
      state: 'open',
      outcome: null,
      settledAt: null,
    });

    const result = await runSweep(store);
    expect(result.expired).toBe(1);
    expect(store.challenges.get('open-1')?.state).toBe('expired');
  });

  it('voids challenges on postponed or canceled games', async () => {
    const now = new Date('2026-09-20T21:00:00.000Z');
    const store = new MemoryStore(now);

    store.seedGame({
      id: 'g1',
      provider: 'fixture',
      providerGameId: '1',
      league: 'nfl',
      homeTeam: 'nfl:KC',
      awayTeam: 'nfl:BUF',
      startsAt: '2026-09-20T20:25:00.000Z',
      status: 'postponed',
      period: null,
      clock: null,
      homeScore: 0,
      awayScore: 0,
      periodScores: [],
      updatedAt: now.toISOString(),
    });

    store.seedChallenge({
      id: 'live-1',
      slug: 'live1',
      creatorId: 'c',
      opponentId: 'o',
      gameId: 'g1',
      market: 'winner',
      creatorPick: 'home',
      line: null,
      quarter: null,
      forfeitKind: 'concession',
      forfeitText: null,
      state: 'accepted',
      outcome: null,
      settledAt: null,
    });

    const result = await runSweep(store);
    expect(result.voided).toBe(1);
    expect(store.challenges.get('live-1')?.state).toBe('void');
  });
});
