/**
 * Rivalry reads for /r/[handle], the Profile page and the result cards.
 * Service role with an explicit participant filter — the same shape the public
 * challenge landing uses, display fields only (BUILD · RLS).
 */
import { createServiceClient } from "@/lib/supabase/service";
import type { ChallengeLanding } from "@/lib/challenges/types";
import {
  computeHeadToHead,
  sortRivalries,
  type HeadToHead,
  type RivalrySummary,
  type SettledPair,
} from "@/lib/rivalry/record";
import { resolveTeamInfo } from "@/lib/teams/catalog";

export type RivalryChallenge = {
  id: string;
  slug: string;
  settledAt: string | null;
  outcome: "creator" | "opponent" | "push" | null;
  creatorId: string;
  opponentId: string | null;
  market: string;
  creatorPick: string;
  line: string | null;
  quarter: number | null;
  forfeitKind: string;
  forfeitText: string | null;
  homeAbbr: string;
  awayAbbr: string;
  league: string;
};

type Row = {
  id: string;
  slug: string;
  settled_at: string | null;
  outcome: "creator" | "opponent" | "push" | null;
  creator_id: string;
  opponent_id: string | null;
  market: string;
  creator_pick: string;
  line: string | null;
  quarter: number | null;
  forfeit_kind: string;
  forfeit_text: string | null;
  game: { league: string; home_team: string; away_team: string } | { league: string; home_team: string; away_team: string }[] | null;
};

const SELECT = `
  id, slug, settled_at, outcome, creator_id, opponent_id,
  market, creator_pick, line, quarter, forfeit_kind, forfeit_text,
  game:games ( league, home_team, away_team )
`;

function mapRow(row: Row): RivalryChallenge | null {
  const gameRaw = row.game;
  const game = Array.isArray(gameRaw) ? gameRaw[0] : gameRaw;
  if (!game) return null;

  return {
    id: row.id,
    slug: row.slug,
    settledAt: row.settled_at,
    outcome: row.outcome,
    creatorId: row.creator_id,
    opponentId: row.opponent_id,
    market: row.market,
    creatorPick: row.creator_pick,
    line: row.line,
    quarter: row.quarter,
    forfeitKind: row.forfeit_kind,
    forfeitText: row.forfeit_text,
    homeAbbr: resolveTeamInfo(game.home_team).abbr,
    awayAbbr: resolveTeamInfo(game.away_team).abbr,
    league: game.league,
  };
}

/** Every settled challenge between two people, newest first. */
export async function listSettledBetween(
  profileA: string,
  profileB: string,
): Promise<RivalryChallenge[]> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("challenges")
    .select(SELECT)
    .eq("state", "settled")
    .or(
      `and(creator_id.eq.${profileA},opponent_id.eq.${profileB}),and(creator_id.eq.${profileB},opponent_id.eq.${profileA})`,
    )
    .order("settled_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as Row[])
    .map(mapRow)
    .filter((row): row is RivalryChallenge => row !== null);
}

/** Head-to-head record between two people, from `subjectId`'s side. */
export async function getHeadToHead(
  subjectId: string,
  otherId: string,
): Promise<HeadToHead> {
  const challenges = await listSettledBetween(subjectId, otherId);
  const pairs: SettledPair[] = challenges.map((row) => ({
    creatorId: row.creatorId,
    opponentId: row.opponentId,
    outcome: row.outcome,
    settledAt: row.settledAt,
  }));
  return computeHeadToHead(pairs, subjectId, otherId);
}

/** The winner's record against the loser, for the result card's rivalry line. */
export async function getRivalryForChallenge(
  challenge: ChallengeLanding,
): Promise<{ wins: number; losses: number } | null> {
  if (!challenge.opponent || !challenge.outcome || challenge.outcome === "push") {
    return null;
  }
  const winner =
    challenge.outcome === "creator" ? challenge.creator : challenge.opponent;
  const loser =
    challenge.outcome === "creator" ? challenge.opponent : challenge.creator;

  const record = await getHeadToHead(winner.id, loser.id);
  if (record.wins + record.losses + record.pushes === 0) return null;
  return { wins: record.wins, losses: record.losses };
}

/** Top rivalries for a profile, busiest first (BUILD · Profile). */
export async function listTopRivalries(
  profileId: string,
  limit = 3,
): Promise<RivalrySummary[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("challenges")
    .select("creator_id, opponent_id, outcome, settled_at")
    .eq("state", "settled")
    .or(`creator_id.eq.${profileId},opponent_id.eq.${profileId}`);

  const rows = (data ?? []) as {
    creator_id: string;
    opponent_id: string | null;
    outcome: "creator" | "opponent" | "push" | null;
    settled_at: string | null;
  }[];

  const pairs: SettledPair[] = rows.map((row) => ({
    creatorId: row.creator_id,
    opponentId: row.opponent_id,
    outcome: row.outcome,
    settledAt: row.settled_at,
  }));

  const otherIds = new Set<string>();
  for (const row of pairs) {
    const other = row.creatorId === profileId ? row.opponentId : row.creatorId;
    if (other && other !== profileId) otherIds.add(other);
  }

  if (otherIds.size === 0) return [];

  const { data: profiles } = await service
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
    .in("id", [...otherIds]);

  const summaries: RivalrySummary[] = (profiles ?? []).map((profile) => {
    const record = computeHeadToHead(pairs, profileId, profile.id as string);
    return {
      profileId: profile.id as string,
      handle: profile.handle as string,
      displayName: profile.display_name as string,
      avatarUrl: (profile.avatar_url as string | null) ?? null,
      ...record,
    };
  });

  return sortRivalries(summaries).slice(0, limit);
}
