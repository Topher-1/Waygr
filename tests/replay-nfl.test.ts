import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@/lib/jobs/memory-store';
import { runPollScores } from '@/lib/jobs/poll-scores';
import { settleGames } from '@/lib/jobs/settle';
import type { ChallengeRow } from '@/lib/jobs/types';
import type { NflFullGameFixture } from '@/lib/scores/fixture-provider';
import { FixtureScoreProvider } from '@/lib/scores/fixture-provider';

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), 'fixtures/nfl-full-game.json'), 'utf8'),
) as NflFullGameFixture & {
  challenges: {
    key: string;
    market: ChallengeRow['market'];
    creatorPick: ChallengeRow['creatorPick'];
    line: number | null;
    quarter: number | null;
    expectedOutcome: 'creator' | 'opponent' | 'push';
    settleAt: string;
  }[];
};

function seedReplay(store: MemoryStore): { gameId: string; challengeIds: Record<string, string> } {
  const gameId = 'game-1';
  const kickoff = new Date(fixture.startsAt);

  store.seedGame({
    id: gameId,
    provider: 'fixture',
    providerGameId: fixture.providerGameId,
    league: fixture.league,
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    startsAt: fixture.startsAt,
    status: 'scheduled',
    period: null,
    clock: null,
    homeScore: 0,
    awayScore: 0,
    periodScores: [],
    updatedAt: kickoff.toISOString(),
  });

  store.seedProfile({ id: 'creator', jerseyTeam: null, jerseyUntil: null });
  store.seedProfile({ id: 'opponent', jerseyTeam: null, jerseyUntil: null });
  store.seedTeamAbbr(fixture.homeTeam, 'KC');
  store.seedTeamAbbr(fixture.awayTeam, 'BUF');

  const challengeIds: Record<string, string> = {};
  for (const c of fixture.challenges) {
    const id = `challenge-${c.key}`;
    challengeIds[c.key] = id;
    store.seedChallenge({
      id,
      slug: c.key,
      creatorId: 'creator',
      opponentId: 'opponent',
      gameId,
      market: c.market,
      creatorPick: c.creatorPick,
      line: c.line,
      quarter: c.quarter,
      forfeitKind: 'concession',
      forfeitText: null,
      state: 'accepted',
      outcome: null,
      settledAt: null,
    });
  }

  return { gameId, challengeIds };
}

describe('NFL full-game replay', () => {
  it('poll-scores + settle gets every market right through the recorded timeline', async () => {
    const store = new MemoryStore(new Date(fixture.startsAt));
    const provider = new FixtureScoreProvider(fixture);
    const { gameId, challengeIds } = seedReplay(store);

    const settledByKey: Record<string, string> = {};

    for (let i = 0; i < fixture.timeline.length; i++) {
      provider.setStepIndex(i);
      const poll = await runPollScores(store, provider);
      if (i > 0) {
        expect(poll.updatedGameIds).toContain(gameId);
      }

      const settleResult = await settleGames(store, [gameId], store.now());
      expect(settleResult.settled).toBeGreaterThanOrEqual(0);

      for (const c of fixture.challenges) {
        const challenge = store.challenges.get(challengeIds[c.key])!;
        if (challenge.state === 'settled') {
          settledByKey[c.key] = challenge.outcome!;
        }
      }
    }

    for (const c of fixture.challenges) {
      expect(settledByKey[c.key], `${c.key} should be settled`).toBe(c.expectedOutcome);
    }

    const finalGame = await store.getGame(gameId);
    expect(finalGame?.status).toBe('final');
    expect(finalGame?.homeScore).toBe(27);
    expect(finalGame?.awayScore).toBe(20);
  });

  it('settles within one poll cycle (30s cron design) of a finished period', async () => {
    const halftimeIndex = fixture.timeline.findIndex((s) => s.label === 'halftime');
    expect(halftimeIndex).toBeGreaterThan(0);

    const store = new MemoryStore(new Date(fixture.startsAt));
    const provider = new FixtureScoreProvider(fixture);
    const { gameId, challengeIds } = seedReplay(store);

    provider.setStepIndex(halftimeIndex);
    await runPollScores(store, provider);
    await settleGames(store, [gameId]);

    const half = store.challenges.get(challengeIds.half_home)!;
    expect(half.state).toBe('settled');
    expect(half.outcome).toBe('creator');
  });
});
