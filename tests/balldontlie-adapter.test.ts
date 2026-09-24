import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  BallDontLieProvider,
  buildListGamesQuery,
  derivePeriod,
  deriveSeasonYear,
  enumerateDateRange,
  mapBalldontlieUpdate,
} from '@/lib/scores/balldontlie';
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

  it('derives NFL season year from calendar month', () => {
    expect(deriveSeasonYear(new Date('2026-09-25T12:00:00.000Z'), 'nfl')).toBe(2026);
    expect(deriveSeasonYear(new Date('2026-01-15T12:00:00.000Z'), 'nfl')).toBe(2025);
  });

  it('enumerates inclusive UTC date range', () => {
    const dates = enumerateDateRange(
      new Date('2026-09-25T00:00:00.000Z'),
      new Date('2026-09-27T00:00:00.000Z'),
    );
    expect(dates).toEqual(['2026-09-25', '2026-09-26', '2026-09-27']);
  });

  it('buildListGamesQuery uses seasons[] and dates[], not start_date/end_date', () => {
    const from = new Date('2026-09-25T00:00:00.000Z');
    const to = new Date('2026-09-27T00:00:00.000Z');
    const query = buildListGamesQuery('nfl', from, to);
    expect(query.seasons).toEqual(['2026']);
    expect(query.dates).toEqual(['2026-09-25', '2026-09-26', '2026-09-27']);
  });

  it('listGames requests seasons[] and dates[] query params', async () => {
    const capturedUrls: string[] = [];
    const fetchImpl = async (input: string | URL | Request) => {
      capturedUrls.push(String(input));
      return {
        ok: true,
        json: async () => ({
          data: [
            {
              id: 1392248,
              date: '2026-09-25T00:15:00.000Z',
              status: 'Scheduled',
              status_state: 'scheduled',
              home_team: { abbreviation: 'GB' },
              visitor_team: { abbreviation: 'ATL' },
              home_team_score: null,
              visitor_team_score: null,
            },
          ],
        }),
      } as Response;
    };

    const provider = new BallDontLieProvider('test-key', fetchImpl);
    const games = await provider.listGames(
      'nfl',
      new Date('2026-09-25T00:00:00.000Z'),
      new Date('2026-09-25T23:59:59.000Z'),
    );

    expect(games).toHaveLength(1);
    expect(games[0].providerGameId).toBe('1392248');
    expect(capturedUrls).toHaveLength(1);
    const url = new URL(capturedUrls[0]);
    expect(url.searchParams.getAll('seasons[]')).toEqual(['2026']);
    expect(url.searchParams.getAll('dates[]')).toEqual(['2026-09-25']);
    expect(url.searchParams.has('start_date')).toBe(false);
    expect(url.searchParams.has('end_date')).toBe(false);
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
