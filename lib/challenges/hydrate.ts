import type { ChallengeLanding } from "@/lib/challenges/types";
import { resolveTeamInfo } from "@/lib/teams/catalog";

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

function mapProfile(row: ProfileRow) {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

/** Map a Supabase challenge row + nested game to ChallengeLanding (catalog team colors). */
export function hydrateChallengeRow(
  row: Record<string, unknown>,
): ChallengeLanding | null {
  const gameRaw = row.game as Record<string, unknown> | Record<string, unknown>[] | null;
  const game = Array.isArray(gameRaw) ? gameRaw[0] : gameRaw;
  if (!game) return null;

  const home = resolveTeamInfo(game.home_team as string);
  const away = resolveTeamInfo(game.away_team as string);
  const creatorRaw = row.creator as ProfileRow | ProfileRow[] | null;
  const creator = Array.isArray(creatorRaw) ? creatorRaw[0] : creatorRaw;
  if (!creator) return null;
  const opponentRaw = row.opponent as ProfileRow | ProfileRow[] | null;
  const opponent = Array.isArray(opponentRaw) ? opponentRaw[0] : opponentRaw;

  return {
    id: row.id as string,
    slug: row.slug as string,
    state: row.state as string,
    market: row.market as string,
    creatorPick: row.creator_pick as string,
    line: row.line as string | null,
    quarter: row.quarter as number | null,
    forfeitKind: row.forfeit_kind as string,
    forfeitText: row.forfeit_text as string | null,
    outcome: row.outcome as string | null,
    acceptedAt: row.accepted_at as string | null,
    settledAt: row.settled_at as string | null,
    creator: mapProfile(creator),
    opponent: opponent ? mapProfile(opponent) : null,
    game: {
      id: game.id as string,
      league: game.league as string,
      startsAt: game.starts_at as string,
      status: game.status as string,
      period: game.period as number | null,
      clock: game.clock as string | null,
      homeScore: game.home_score as number,
      awayScore: game.away_score as number,
      periodScores:
        (game.period_scores as ChallengeLanding["game"]["periodScores"]) ?? [],
      updatedAt:
        (game.updated_at as string | undefined) ?? new Date(0).toISOString(),
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
    },
  };
}
