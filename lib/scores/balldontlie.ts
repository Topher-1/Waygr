import type { GameStatus } from '@/lib/settle';
import type { GameUpdate, GameUpsert, League, PeriodScore, ScoreProvider } from '@/lib/scores/types';

const PROVIDER = 'balldontlie';
const BASE_URL = 'https://api.balldontlie.io';

const LEAGUE_PATH: Record<League, string> = {
  nfl: 'nfl',
  ncaaf: 'ncaaf',
  nba: 'nba',
  ncaab: 'ncaab',
};

type BdlTeam = {
  abbreviation: string;
};

type BdlGame = {
  id: number;
  date: string;
  status: string | null;
  status_state: string;
  home_team: BdlTeam;
  visitor_team: BdlTeam;
  home_team_score: number | null;
  visitor_team_score: number | null;
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
};

function teamCode(league: League, abbr: string): string {
  return `${league}:${abbr}`;
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
  const { home, away } = quarterFields(game);
  const periodScores = buildPeriodScores(home, away);
  const status = mapStatus(game.status_state);
  const period = derivePeriod(game.status, game.status_state, periodScores);

  return {
    providerGameId: String(game.id),
    league,
    homeTeamCode: teamCode(league, game.home_team.abbreviation),
    awayTeamCode: teamCode(league, game.visitor_team.abbreviation),
    startsAt: new Date(game.date),
    status,
    period,
    clock: game.time ?? null,
    homeScore: game.home_team_score ?? 0,
    awayScore: game.visitor_team_score ?? 0,
    periodScores,
  };
}

function mapUpdate(game: BdlGame): GameUpdate {
  const { home, away } = quarterFields(game);
  const periodScores = buildPeriodScores(home, away);
  const status = mapStatus(game.status_state);
  const period = derivePeriod(game.status, game.status_state, periodScores);

  return {
    providerGameId: String(game.id),
    status,
    period,
    clock: game.time ?? null,
    homeScore: game.home_team_score ?? 0,
    awayScore: game.visitor_team_score ?? 0,
    periodScores,
  };
}

export class BallDontLieProvider implements ScoreProvider {
  readonly name = PROVIDER;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request<T>(league: League, path: string, params: Record<string, string>): Promise<T> {
    if (!this.apiKey) {
      throw new Error('BALLDONTLIE_API_KEY is not configured');
    }

    const url = new URL(`${BASE_URL}/${LEAGUE_PATH[league]}/v1${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
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
    const data = await this.request<{ data: BdlGame[] }>(league, '/games', {
      start_date: from.toISOString().slice(0, 10),
      end_date: to.toISOString().slice(0, 10),
      per_page: '100',
    });
    return data.data.map((game) => mapGame(league, game));
  }

  async getLive(providerGameIds: string[]): Promise<GameUpdate[]> {
    return this.getLiveForLeague('nfl', providerGameIds);
  }

  async getLiveForLeague(league: League, providerGameIds: string[]): Promise<GameUpdate[]> {
    if (providerGameIds.length === 0) return [];

    const updates: GameUpdate[] = [];
    for (const id of providerGameIds) {
      const data = await this.request<{ data: BdlGame[] }>(league, '/games', {
        ids: id,
        per_page: '1',
      });
      for (const game of data.data) {
        updates.push(mapUpdate(game));
      }
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
