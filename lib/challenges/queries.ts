import type { ChallengeLanding } from "@/lib/challenges/types";
import { createServiceClient } from "@/lib/supabase/service";

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

type TeamRow = {
  code: string;
  abbr: string;
  name: string;
  primary_color: string;
  secondary_color: string;
};

function mapProfile(row: ProfileRow) {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

function mapTeam(row: TeamRow) {
  return {
    code: row.code,
    abbr: row.abbr,
    name: row.name,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
  };
}

/** Public challenge landing data — service role, display fields only (BUILD). */
export async function getChallengeBySlug(
  slug: string,
): Promise<ChallengeLanding | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("challenges")
    .select(
      `
      id,
      slug,
      state,
      market,
      creator_pick,
      line,
      quarter,
      forfeit_kind,
      forfeit_text,
      outcome,
      accepted_at,
      settled_at,
      creator:profiles!challenges_creator_id_fkey (
        id, handle, display_name, avatar_url
      ),
      opponent:profiles!challenges_opponent_id_fkey (
        id, handle, display_name, avatar_url
      ),
      game:games (
        id,
        league,
        starts_at,
        status,
        period,
        clock,
        home_score,
        away_score,
        period_scores,
        updated_at,
        home_team,
        away_team
      )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  type GameRow = {
    id: string;
    league: string;
    starts_at: string;
    status: string;
    period: number | null;
    clock: string | null;
    home_score: number;
    away_score: number;
    period_scores: { period: number; home: number; away: number }[] | null;
    updated_at: string;
    home_team: string;
    away_team: string;
  };

  const gameRaw = data.game as GameRow | GameRow[] | null;
  const game = Array.isArray(gameRaw) ? gameRaw[0] : gameRaw;
  if (!game) {
    return null;
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("code, abbr, name, primary_color, secondary_color")
    .in("code", [game.home_team, game.away_team]);

  const teamMap = new Map(
    (teams ?? []).map((t) => [t.code, mapTeam(t as TeamRow)]),
  );

  const homeTeam = teamMap.get(game.home_team);
  const awayTeam = teamMap.get(game.away_team);
  if (!homeTeam || !awayTeam) {
    return null;
  }

  const creatorRaw = data.creator as ProfileRow | ProfileRow[] | null;
  const creator = Array.isArray(creatorRaw) ? creatorRaw[0] : creatorRaw;
  if (!creator) {
    return null;
  }

  const opponentRaw = data.opponent as ProfileRow | ProfileRow[] | null;
  const opponent = Array.isArray(opponentRaw) ? opponentRaw[0] : opponentRaw;

  return {
    id: data.id,
    slug: data.slug,
    state: data.state,
    market: data.market,
    creatorPick: data.creator_pick,
    line: data.line,
    quarter: data.quarter,
    forfeitKind: data.forfeit_kind,
    forfeitText: data.forfeit_text,
    outcome: data.outcome,
    acceptedAt: data.accepted_at,
    settledAt: data.settled_at,
    creator: mapProfile(creator),
    opponent: opponent ? mapProfile(opponent) : null,
    game: {
      id: game.id,
      league: game.league,
      startsAt: game.starts_at,
      status: game.status,
      period: game.period,
      clock: game.clock,
      homeScore: game.home_score,
      awayScore: game.away_score,
      periodScores: game.period_scores ?? [],
      updatedAt: game.updated_at,
      homeTeam,
      awayTeam,
    },
  };
}
