import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  BallDontLieProvider,
  buildListGamesQuery,
  derivePeriod,
  deriveSeasonYear,
  enumerateDateRange,
  mapBalldontlieGame,
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

  it('derives MLB season year from March start', () => {
    expect(deriveSeasonYear(new Date('2026-02-15T12:00:00.000Z'), 'mlb')).toBe(2025);
    expect(deriveSeasonYear(new Date('2026-03-15T12:00:00.000Z'), 'mlb')).toBe(2026);
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

  it('buildListGamesQuery includes both seasons when window crosses MLB season start', () => {
    const from = new Date('2026-02-20T00:00:00.000Z');
    const to = new Date('2026-03-05T00:00:00.000Z');
    const query = buildListGamesQuery('mlb', from, to);
    expect(query.seasons).toEqual(['2025', '2026']);
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

  it('maps NFL live scores from quarter fields when aggregate is null', () => {
    const update = mapBalldontlieUpdate({
      id: 1392248,
      date: '2026-09-25T00:15:00.000Z',
      status: '2nd Qtr',
      status_state: 'in_progress',
      home_team: { abbreviation: 'GB' },
      visitor_team: { abbreviation: 'ATL' },
      home_team_score: null,
      visitor_team_score: null,
      home_team_q1: 7,
      home_team_q2: 3,
      home_team_q3: null,
      home_team_q4: null,
      home_team_ot: null,
      visitor_team_q1: 0,
      visitor_team_q2: 10,
      visitor_team_q3: null,
      visitor_team_q4: null,
      visitor_team_ot: null,
      period: 2,
      time: '7:42',
    });

    expect(update.homeScore).toBe(10);
    expect(update.awayScore).toBe(10);
    expect(update.period).toBe(2);
    expect(update.clock).toBe('7:42');
    expect(update.periodScores).toEqual([
      { period: 1, home: 7, away: 0 },
      { period: 2, home: 3, away: 10 },
    ]);
  });

  it('maps NFL live scores from quarter fields when aggregate is stuck at zero', () => {
    const update = mapBalldontlieUpdate({
      id: 1392248,
      date: '2026-09-25T00:15:00.000Z',
      status: '2nd Qtr',
      status_state: 'in_progress',
      home_team: { abbreviation: 'GB' },
      visitor_team: { abbreviation: 'ATL' },
      home_team_score: 0,
      visitor_team_score: 0,
      home_team_q1: 14,
      home_team_q2: 0,
      home_team_q3: null,
      home_team_q4: null,
      home_team_ot: null,
      visitor_team_q1: 7,
      visitor_team_q2: 7,
      visitor_team_q3: null,
      visitor_team_q4: null,
      visitor_team_ot: null,
      period: 2,
      display_clock: '0:31',
    });

    expect(update.homeScore).toBe(14);
    expect(update.awayScore).toBe(14);
    expect(update.clock).toBe('0:31');
  });

  it('getLiveForLeague fetches /games/{id} instead of unsupported ids query', async () => {
    const capturedUrls: string[] = [];
    const fetchImpl = async (input: string | URL | Request) => {
      capturedUrls.push(String(input));
      return {
        ok: true,
        json: async () => ({
          data: {
            id: 1392248,
            date: '2026-09-25T00:15:00.000Z',
            status: '2nd Qtr',
            status_state: 'in_progress',
            home_team: { abbreviation: 'GB' },
            visitor_team: { abbreviation: 'ATL' },
            home_team_score: 10,
            visitor_team_score: 10,
            home_team_q1: 7,
            home_team_q2: 3,
            home_team_q3: null,
            home_team_q4: null,
            home_team_ot: null,
            visitor_team_q1: 0,
            visitor_team_q2: 10,
            visitor_team_q3: null,
            visitor_team_q4: null,
            visitor_team_ot: null,
            period: 2,
            time: '7:42',
          },
        }),
      } as Response;
    };

    const provider = new BallDontLieProvider('test-key', fetchImpl);
    const updates = await provider.getLiveForLeague('nfl', ['1392248']);

    expect(updates).toHaveLength(1);
    expect(updates[0].homeScore).toBe(10);
    expect(updates[0].awayScore).toBe(10);
    expect(capturedUrls).toHaveLength(1);
    const url = new URL(capturedUrls[0]);
    expect(url.pathname).toBe('/nfl/v1/games/1392248');
    expect(url.searchParams.has('ids')).toBe(false);
  });

  it('maps MLB game payload with inning scores', () => {
    const game = mapBalldontlieGame('mlb', {
      id: 42,
      date: '2026-09-24T00:08:00.000Z',
      status: 'STATUS_FINAL',
      status_state: 'final',
      home_team: { abbreviation: 'NYY' },
      away_team: { abbreviation: 'LAD' },
      home_team_data: {
        runs: 5,
        inning_scores: [1, 0, 2, 0, 2],
      },
      away_team_data: {
        runs: 3,
        inning_scores: [0, 1, 0, 2, 0],
      },
      period: 9,
      display_clock: '0:00',
    });

    expect(game.league).toBe('mlb');
    expect(game.homeTeamCode).toBe('mlb:NYY');
    expect(game.awayTeamCode).toBe('mlb:LAD');
    expect(game.homeScore).toBe(5);
    expect(game.awayScore).toBe(3);
    expect(game.periodScores).toEqual([
      { period: 1, home: 1, away: 0 },
      { period: 2, home: 0, away: 1 },
      { period: 3, home: 2, away: 0 },
      { period: 4, home: 0, away: 2 },
      { period: 5, home: 2, away: 0 },
    ]);
    expect(game.status).toBe('final');
    expect(game.period).toBe(9);
  });
});
