import type { League } from "@/lib/scores/types";

export const DEFAULT_GAMES_WINDOW_DAYS = 7;
export const MAX_GAMES_WINDOW_DAYS = 7;

export type GamesQueryParams = {
  league: League | null;
  from: Date;
  to: Date;
};

export type GamesQueryRejectReason = "invalid_league" | "invalid_range";

const LEAGUES: League[] = ["nfl", "ncaaf", "nba", "ncaab", "mlb"];

function parseDate(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

/** Parse and clamp GET /api/games query bounds (unit-tested). */
export function parseGamesQuery(
  searchParams: URLSearchParams,
  now: Date,
): { ok: true; params: GamesQueryParams } | { ok: false; reason: GamesQueryRejectReason } {
  const leagueRaw = searchParams.get("league");
  let league: League | null = null;
  if (leagueRaw) {
    if (!LEAGUES.includes(leagueRaw as League)) {
      return { ok: false, reason: "invalid_league" };
    }
    league = leagueRaw as League;
  }

  const defaultFrom = now;
  const defaultTo = new Date(
    now.getTime() + DEFAULT_GAMES_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const from = parseDate(searchParams.get("from"), defaultFrom);
  const to = parseDate(searchParams.get("to"), defaultTo);

  if (to.getTime() <= from.getTime()) {
    return { ok: false, reason: "invalid_range" };
  }

  const maxTo = new Date(
    from.getTime() + MAX_GAMES_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const clampedTo = to.getTime() > maxTo.getTime() ? maxTo : to;

  return { ok: true, params: { league, from, to: clampedTo } };
}
