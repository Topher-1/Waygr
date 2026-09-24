import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { derivePeriod, mapBalldontlieUpdate } from '@/lib/scores/balldontlie';
import type { NflFullGameFixture } from '@/lib/scores/fixture-provider';
import { FixtureScoreProvider } from '@/lib/scores/fixture-provider';

describe('balldontlie adapter', () => {
  it('derives period 3 at NFL halftime with two quarters scored', () => {
    const period = derivePeriod('Halftime', 'in_progress', [
      { period: 1, home: 7, away: 3 },
      { period: 2, home: 10, away: 7 },
    ]);
    expect(period).toBe(3);
  });

  it('maps halftime fixture update', () => {
    const update = mapBalldontlieUpdate({
      id: 999001,
      date: '2026-09-20T20:25:00.000Z',
      status: 'Halftime',
      status_state: 'in_progress',
      home_team: { abbreviation: 'KC' },
      visitor_team: { abbreviation: 'BUF' },
      home_team_score: 17,
      visitor_team_score: 10,
      home_team_q1: 7,
      home_team_q2: 10,
      home_team_q3: null,
      home_team_q4: null,
      home_team_ot: null,
      visitor_team_q1: 3,
      visitor_team_q2: 7,
      visitor_team_q3: null,
      visitor_team_q4: null,
      visitor_team_ot: null,
      time: null,
    });
    expect(update.period).toBe(3);
    expect(update.periodScores).toHaveLength(2);
  });

  it('fixture provider halftime step maps period 3', async () => {
    const fixture = JSON.parse(
      readFileSync('fixtures/nfl-full-game.json', 'utf8'),
    ) as NflFullGameFixture;
    const provider = new FixtureScoreProvider(fixture);
    const idx = fixture.timeline.findIndex((s) => s.label === 'halftime');
    provider.setStepIndex(idx);
    const [update] = await provider.getLive([fixture.providerGameId]);
    expect(update.period).toBe(3);
  });
});
