import { buildCreateGamesOrFilter, isGameInCreateList } from "@/lib/games/create-list";
import { resolveTeamInfo } from "@/lib/teams/catalog";
import { createScoreProvider } from "@/lib/scores";
import { FixtureScoreProvider as FixtureProvider } from "@/lib/scores/fixture-provider";
import type { GameUpsert, League } from "@/lib/scores/types";
import { createServiceClient } from "@/lib/supabase/service";
import nflFixture from "@/fixtures/nfl-full-game.json";
import type { NflFullGameFixture } from "@/lib/scores/fixture-provider";

/** Free BDL PoC leagues synced on create/home schedule refresh. */
export const PHASE1_LEAGUES: League[] = ["nfl", "nba", "mlb"];

export type GameListItem = {
  id: string;
  league: League;
  startsAt: string;
  status: string;
  homeTeam: {
    code: string;
    abbr: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
  };
  awayTeam: {
    code: string;
    abbr: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
  };
};

async function ensureTeams(codes: string[]): Promise<void> {
  const service = createServiceClient();
  const rows = [...new Set(codes)].map((code) => {
    const info = resolveTeamInfo(code);
    return {
      code: info.code,
      league: info.league,
      abbr: info.abbr,
      name: info.name,
      primary_color: info.primaryColor,
      secondary_color: info.secondaryColor,
    };
  });

  if (rows.length === 0) return;
  const { error } = await service.from("teams").upsert(rows, { onConflict: "code" });
  if (error) throw error;
}

async function upsertGameRow(
  provider: string,
  game: GameUpsert,
): Promise<string> {
  const service = createServiceClient();
  await ensureTeams([game.homeTeamCode, game.awayTeamCode]);

  const { data: existing } = await service
    .from("games")
    .select("id, status, period, clock, home_score, away_score, period_scores")
    .eq("provider", provider)
    .eq("provider_game_id", game.providerGameId)
    .maybeSingle();

  const keepScores =
    existing?.status === "live" || existing?.status === "final";

  const row = {
    provider,
    provider_game_id: game.providerGameId,
    league: game.league,
    home_team: game.homeTeamCode,
    away_team: game.awayTeamCode,
    starts_at: game.startsAt.toISOString(),
    status: keepScores ? existing!.status : game.status,
    period: keepScores ? existing!.period : game.period,
    clock: keepScores ? existing!.clock : game.clock,
    home_score: keepScores ? existing!.home_score : game.homeScore,
    away_score: keepScores ? existing!.away_score : game.awayScore,
    period_scores: keepScores ? existing!.period_scores : game.periodScores,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await service
    .from("games")
    .upsert(row, { onConflict: "provider,provider_game_id" })
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("Failed to upsert game");
  return data.id as string;
}

function createProviderForSchedule() {
  if (process.env.BALLDONTLIE_API_KEY) {
    return createScoreProvider();
  }
  const fixture = nflFixture as NflFullGameFixture;
  const shifted: NflFullGameFixture = {
    ...fixture,
    startsAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
  };
  return new FixtureProvider(shifted);
}

async function syncScheduleFromProvider(
  params: { league: League | null; from: Date; to: Date },
): Promise<void> {
  const provider = createProviderForSchedule();
  const leagues = params.league ? [params.league] : PHASE1_LEAGUES;

  for (const league of leagues) {
    let games: GameUpsert[];
    try {
      games = await provider.listGames(league, params.from, params.to);
    } catch {
      games = [];
    }

    if (
      games.length === 0 &&
      provider instanceof FixtureProvider &&
      league === "nfl"
    ) {
      games = await provider.listGames(league, params.from, params.to);
    }

    for (const game of games) {
      await upsertGameRow(provider.name, game);
    }
  }
}

/** Read stored games in range — no ScoreProvider sync or writes. */
export async function listStoredGames(
  params: { league: League | null; from: Date; to: Date },
): Promise<GameListItem[]> {
  const service = createServiceClient();
  let query = service
    .from("games")
    .select("id, league, starts_at, status, home_team, away_team")
    .or(buildCreateGamesOrFilter(params.from, params.to))
    .order("starts_at", { ascending: true });

  if (params.league) {
    query = query.eq("league", params.league);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const home = resolveTeamInfo(row.home_team as string);
      const away = resolveTeamInfo(row.away_team as string);
      return {
        id: row.id as string,
        league: row.league as League,
        startsAt: row.starts_at as string,
        status: row.status as string,
        homeTeam: {
          code: home.code,
          abbr: home.abbr,
          name: home.name,
          primaryColor: home.primaryColor,
          secondaryColor: home.secondaryColor,
        },
        awayTeam: {
          code: away.code,
          abbr: away.abbr,
          name: away.name,
          primaryColor: away.primaryColor,
          secondaryColor: away.secondaryColor,
        },
      };
    })
    .filter((game) =>
      isGameInCreateList(
        { status: game.status, startsAt: new Date(game.startsAt) },
        params.from,
        params.to,
      ),
    );
}

/** Sync schedule from ScoreProvider (when allowed) and return games in range. */
export async function listGamesForCreate(
  params: { league: League | null; from: Date; to: Date },
  options: { sync: boolean } = { sync: false },
): Promise<GameListItem[]> {
  if (options.sync) {
    await syncScheduleFromProvider(params);
  }
  return listStoredGames(params);
}

/** List scheduled games for rematch candidate search. */
export async function listScheduledGames(
  from: Date,
  to: Date,
): Promise<
  {
    id: string;
    homeTeam: string;
    awayTeam: string;
    startsAt: string;
    status: string;
  }[]
> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("games")
    .select("id, home_team, away_team, starts_at, status")
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .eq("status", "scheduled")
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    homeTeam: row.home_team as string,
    awayTeam: row.away_team as string,
    startsAt: row.starts_at as string,
    status: row.status as string,
  }));
}
