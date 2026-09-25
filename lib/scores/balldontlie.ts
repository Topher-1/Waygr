import type { GameStatus } from '@/lib/settle.ts';
import type { GameUpdate, GameUpsert, League, PeriodScore, ScoreProvider } from '@/lib/scores/types.ts';

const PROVIDER = 'balldontlie';
const BASE_URL = 'https://api.balldontlie.io';
const MAX_LIST_GAMES_DAYS = 14;

/** Football seasons start in September; basketball in October (NBA) or November (NCAAB); MLB in March. */
const SEASON_START_MONTH: Record<League, number> = {
  nfl: 8,
  ncaaf: 8,
  nba: 9,
  ncaab: 10,
  mlb: 2,
};

const LEAGUE_PATH: Record<League, string> = {
  nfl: 'nfl',
  ncaaf: 'ncaaf',
  nba: 'nba',
  ncaab: 'ncaab',
  mlb: 'mlb',
};

type BdlTeam = {
  abbreviation: string;
};

type BdlInningData = {
  runs?: number | null;
  inning_scores?: number[];
};

type BdlGame = {
  id: number;
  date: string;
  status: string | null;
  status_state: string;
  home_team: BdlTeam;
  visitor_team?: BdlTeam;
  away_team?: BdlTeam;
  home_team_score?: number | null;
  visitor_team_score?: number | null;
  home_team_data?: BdlInningData;
  away_team_data?: BdlInningData;
  home_team_q1?: number | null;
  home_team_q2?: number | null;
  home_team_q3?: number | null;
  home_team_q4?: number | null;
  home_team_ot?: number | null;
  visitor_team_q1?: number | null;
  visitor_team_q2?: number | null;
  visitor_team_q3?: number | null;
  visitor_team_q4?: number | null;
  visitor_team_ot?: number | null;
  period?: number | null;
  time?: string | null;
  display_clock?: string | null;
};

function teamCode(league: League, abbr: string): string {
  return `${league}:${abbr}`;
}

function awayTeamAbbr(game: BdlGame): string {
  return (game.visitor_team ?? game.away_team)?.abbreviation ?? 'UNK';
}

function sumQuarterScores(
  q1?: number | null,
  q2?: number | null,
  q3?: number | null,
  q4?: number | null,
  ot?: number | null,
): number | null {
  const quarters = [q1, q2, q3, q4, ot];
  const scored = quarters.filter((q) => q != null);
  if (scored.length === 0) {
    return null;
  }
  return scored.reduce((sum, q) => sum + (q ?? 0), 0);
}

/** NFL live payloads may omit aggregate scores while quarter fields are populated. */
function readHomeScore(game: BdlGame): number {
  const fromQuarters = sumQuarterScores(
    game.home_team_q1,
    game.home_team_q2,
    game.home_team_q3,
    game.home_team_q4,
    game.home_team_ot,
  );
  const aggregate = game.home_team_score ?? game.home_team_data?.runs ?? null;

  if (fromQuarters !== null) {
    if (aggregate == null || (aggregate === 0 && fromQuarters > 0)) {
      return fromQuarters;
    }
    return aggregate;
  }

  return aggregate ?? 0;
}

function readAwayScore(game: BdlGame): number {
  const fromQuarters = sumQuarterScores(
    game.visitor_team_q1,
    game.visitor_team_q2,
    game.visitor_team_q3,
    game.visitor_team_q4,
    game.visitor_team_ot,
  );
  const aggregate = game.visitor_team_score ?? game.away_team_data?.runs ?? null;

  if (fromQuarters !== null) {
    if (aggregate == null || (aggregate === 0 && fromQuarters > 0)) {
      return fromQuarters;
    }
    return aggregate;
  }

  return aggregate ?? 0;
}

function readClock(game: BdlGame): string | null {
  return game.display_clock ?? game.time ?? null;
}

function mapStatus(statusState: string): GameStatus {
  switch (statusState) {
    case 'scheduled':
    case 'delayed':
      return 'scheduled';
    case 'in_progress':
      return 'live';
    case 'final':
      return 'final';
    case 'postponed':
      return 'postponed';
    case 'canceled':
    case 'abandoned':
      return 'canceled';
    case 'suspended':
      return 'suspended';
    default:
      return 'scheduled';
  }
}

function quarterFields(game: BdlGame): { home: (number | null)[]; away: (number | null)[] } {
  return {
    home: [
      game.home_team_q1 ?? null,
      game.home_team_q2 ?? null,
      game.home_team_q3 ?? null,
      game.home_team_q4 ?? null,
      game.home_team_ot ?? null,
    ],
    away: [
      game.visitor_team_q1 ?? null,
      game.visitor_team_q2 ?? null,
      game.visitor_team_q3 ?? null,
      game.visitor_team_q4 ?? null,
      game.visitor_team_ot ?? null,
    ],
  };
}

function inningFields(game: BdlGame): { home: (number | null)[]; away: (number | null)[] } {
  const homeInnings = game.home_team_data?.inning_scores ?? [];
  const awayInnings = game.away_team_data?.inning_scores ?? [];
  const len = Math.max(homeInnings.length, awayInnings.length);
  const home: (number | null)[] = [];
  const away: (number | null)[] = [];
  for (let i = 0; i < len; i++) {
    const h = homeInnings[i];
    const a = awayInnings[i];
    if (h !== undefined && a !== undefined) {
      home.push(h);
      away.push(a);
    }
  }
  return { home, away };
}

function periodFields(game: BdlGame): { home: (number | null)[]; away: (number | null)[] } {
  if (game.home_team_data?.inning_scores || game.away_team_data?.inning_scores) {
    return inningFields(game);
  }
  return quarterFields(game);
}

function buildPeriodScores(homeQ: (number | null)[], awayQ: (number | null)[]): PeriodScore[] {
  const scores: PeriodScore[] = [];
  for (let i = 0; i < homeQ.length; i++) {
    const home = homeQ[i];
    const away = awayQ[i];
    if (home !== null && away !== null) {
      scores.push({ period: i + 1, home, away });
    }
  }
  return scores;
}

/** At halftime/between quarters, period = next period (BUILD adapter rule). */
export function derivePeriod(
  status: string | null,
  statusState: string,
  periodScores: PeriodScore[],
): number | null {
  if (statusState === 'scheduled' || statusState === 'postponed' || statusState === 'canceled') {
    return null;
  }

  if (statusState === 'final') {
    return periodScores.length > 0 ? periodScores[periodScores.length - 1].period : 4;
  }

  const s = (status ?? '').toLowerCase();
  if (s.includes('halftime')) {
    const completed = periodScores.filter((p) => p.period <= 2);
    return completed.length >= 2 ? 3 : 2;
  }
  if (s.includes('end of 1') || s.includes('1st') && s.includes('end')) return 2;
  if (s.includes('end of 2') || s.includes('2nd') && s.includes('end')) return 3;
  if (s.includes('end of 3') || s.includes('3rd') && s.includes('end')) return 4;
  if (s.includes('overtime') || s.includes(' ot')) return 5;

  const match = s.match(/(\d)(?:st|nd|rd|th)?\s*q/i);
  if (match) {
    const current = Number.parseInt(match[1], 10);
    return Number.isFinite(current) ? current : null;
  }

  if (typeof status === 'string' && statusState === 'in_progress') {
    const lastComplete = periodScores.length;
    return lastComplete > 0 ? lastComplete + 1 : 1;
  }

  return periodScores.length > 0 ? periodScores.length : 1;
}

function mapGame(league: League, game: BdlGame): GameUpsert {
  const { home, away } = periodFields(game);
  const periodScores = buildPeriodScores(home, away);
  const status = mapStatus(game.status_state);
  const period =
    game.period ?? derivePeriod(game.status, game.status_state, periodScores);

  return {
    providerGameId: String(game.id),
    league,
    homeTeamCode: teamCode(league, game.home_team.abbreviation),
    awayTeamCode: teamCode(league, awayTeamAbbr(game)),
    startsAt: new Date(game.date),
    status,
    period,
    clock: readClock(game),
    homeScore: readHomeScore(game),
    awayScore: readAwayScore(game),
    periodScores,
  };
}

/** BDL season year for a calendar date (e.g. Jan 2026 NFL → 2025; Sep 2026 NFL → 2026). */
export function deriveSeasonYear(date: Date, league: League): number {
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  return month >= SEASON_START_MONTH[league] ? year : year - 1;
}

function formatDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Inclusive UTC calendar days from `from` through `to`, capped for rate limits. */
export function enumerateDateRange(from: Date, to: Date, maxDays = MAX_LIST_GAMES_DAYS): string[] {
  const dates: string[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);

  while (cursor <= end && dates.length < maxDays) {
    dates.push(formatDateUTC(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function buildListGamesQuery(
  league: League,
  from: Date,
  to: Date,
): { seasons: string[]; dates: string[] } {
  const seasons = new Set([
    String(deriveSeasonYear(from, league)),
    String(deriveSeasonYear(to, league)),
  ]);
  return {
    seasons: [...seasons].sort(),
    dates: enumerateDateRange(from, to),
  };
}

function mapUpdate(game: BdlGame): GameUpdate {
  const { home, away } = periodFields(game);
  const periodScores = buildPeriodScores(home, away);
  const status = mapStatus(game.status_state);
  const period =
    game.period ?? derivePeriod(game.status, game.status_state, periodScores);

  return {
    providerGameId: String(game.id),
    status,
    period,
    clock: readClock(game),
    homeScore: readHomeScore(game),
    awayScore: readAwayScore(game),
    periodScores,
  };
}

export class BallDontLieProvider implements ScoreProvider {
  readonly name = PROVIDER;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request<T>(
    league: League,
    path: string,
    params: Record<string, string | string[]>,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('BALLDONTLIE_API_KEY is not configured');
    }

    const url = new URL(`${BASE_URL}/${LEAGUE_PATH[league]}/v1${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        for (const entry of value) {
          url.searchParams.append(key, entry);
        }
      } else {
        url.searchParams.set(key, value);
      }
    }

    const response = await this.fetchImpl(url.toString(), {
      headers: { Authorization: this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`BALLDONTLIE ${response.status}: ${await response.text()}`);
    }

    return (await response.json()) as T;
  }

  async listGames(league: League, from: Date, to: Date): Promise<GameUpsert[]> {
    const { seasons, dates } = buildListGamesQuery(league, from, to);
    if (dates.length === 0) return [];

    const byId = new Map<number, BdlGame>();
    let cursor: string | undefined;

    do {
      const params: Record<string, string | string[]> = {
        'seasons[]': seasons,
        'dates[]': dates,
        per_page: '100',
      };
      if (cursor) params.cursor = cursor;

      const data = await this.request<{ data: BdlGame[]; meta?: { next_cursor?: number | null } }>(
        league,
        '/games',
        params,
      );

      for (const game of data.data) {
        byId.set(game.id, game);
      }

      const next = data.meta?.next_cursor;
      cursor = next != null && next !== 0 ? String(next) : undefined;
    } while (cursor);

    return [...byId.values()].map((game) => mapGame(league, game));
  }

  async getLive(providerGameIds: string[]): Promise<GameUpdate[]> {
    return this.getLiveForLeague('nfl', providerGameIds);
  }

  async getLiveForLeague(league: League, providerGameIds: string[]): Promise<GameUpdate[]> {
    if (providerGameIds.length === 0) return [];

    const updates: GameUpdate[] = [];
    for (const id of providerGameIds) {
      const data = await this.request<{ data: BdlGame }>(league, `/games/${id}`, {});
      updates.push(mapUpdate(data.data));
    }
    return updates;
  }
}

/** Maps a raw BALLDONTLIE game payload (fixture/replay) without HTTP. */
export function mapBalldontlieGame(league: League, game: BdlGame): GameUpsert {
  return mapGame(league, game);
}

export function mapBalldontlieUpdate(game: BdlGame): GameUpdate {
  return mapUpdate(game);
}

export type { BdlGame };
