import { formatCall } from "@/lib/challenges/format";
import { hydrateChallengeRow } from "@/lib/challenges/hydrate";
import type { ChallengeLanding } from "@/lib/challenges/types";
import { createServiceClient } from "@/lib/supabase/service";
import type { ViewerProfile } from "@/lib/auth/profile";
import { listGamesForCreate } from "@/lib/games/sync";
import { defaultLine, type Market } from "@/lib/challenges/create";

export type HomeLiveChallenge = ChallengeLanding & { view: "live" };
export type HomeOpenChallenge = ChallengeLanding & { view: "open" };

export type HomeOwedForfeit = {
  id: string;
  challengeId: string;
  challengeSlug: string;
  owedToName: string;
  kind: string;
  call: string;
};

export type TonightQuickCall = {
  gameId: string;
  label: string;
  league: string;
  startsAt: string;
  homeAbbr: string;
  awayAbbr: string;
  homeColor: string;
  awayColor: string;
  defaultMarket: Market;
  defaultPick: "home" | "away";
  defaultLine: number;
};

export type HomeFeed = {
  live: HomeLiveChallenge[];
  owedForfeits: HomeOwedForfeit[];
  openWaiting: HomeOpenChallenge[];
  tonightQuickCalls: TonightQuickCall[];
};

/** Home feed for signed-in user (BUILD ordering). */
export async function getHomeFeed(viewer: ViewerProfile): Promise<HomeFeed> {
  const service = createServiceClient();
  const now = new Date();
  const tonightEnd = new Date(now);
  tonightEnd.setHours(23, 59, 59, 999);

  const challengeSelect = `
    id, slug, state, market, creator_pick, line, quarter,
    forfeit_kind, forfeit_text, outcome, accepted_at, settled_at,
    creator:profiles!challenges_creator_id_fkey ( id, handle, display_name, avatar_url ),
    opponent:profiles!challenges_opponent_id_fkey ( id, handle, display_name, avatar_url ),
    game:games (
      id, league, starts_at, status, period, clock, home_score, away_score, home_team, away_team
    )
  `;

  const { data: participantRows } = await service
    .from("challenges")
    .select(challengeSelect)
    .or(`creator_id.eq.${viewer.id},opponent_id.eq.${viewer.id}`)
    .in("state", ["open", "accepted", "live"])
    .order("created_at", { ascending: false });

  const live: HomeLiveChallenge[] = [];
  const openWaiting: HomeOpenChallenge[] = [];

  for (const row of participantRows ?? []) {
    const challenge = hydrateChallengeRow(row as Record<string, unknown>);
    if (!challenge) continue;
    const bucket = bucketHomeChallenge(challenge, viewer.id);
    if (bucket === "live") {
      live.push({ ...challenge, view: "live" });
    } else if (bucket === "openWaiting") {
      openWaiting.push({ ...challenge, view: "open" });
    }
  }

  const { data: forfeitRows } = await service
    .from("forfeits")
    .select(
      `
      id,
      kind,
      challenge:challenges!inner (
        id, slug, market, creator_pick, line, quarter, forfeit_kind, forfeit_text,
        creator:profiles!challenges_creator_id_fkey ( display_name ),
        opponent:profiles!challenges_opponent_id_fkey ( display_name ),
        game:games ( home_team, away_team, league, starts_at, status, id, period, clock, home_score, away_score )
      ),
      owed_to:profiles!forfeits_owed_to_fkey ( display_name )
    `,
    )
    .eq("owed_by", viewer.id)
    .eq("status", "owed")
    .order("due_at", { ascending: true });

  const owedForfeits: HomeOwedForfeit[] = [];
  for (const row of forfeitRows ?? []) {
    const challengeRaw = row.challenge as Record<string, unknown> | Record<string, unknown>[];
    const challengeRow = Array.isArray(challengeRaw) ? challengeRaw[0] : challengeRaw;
    if (!challengeRow) continue;
    const landing = hydrateChallengeRow(challengeRow);
    if (!landing) continue;
    const owedToRaw = row.owed_to as { display_name: string } | { display_name: string }[];
    const owedTo = Array.isArray(owedToRaw) ? owedToRaw[0] : owedToRaw;
    owedForfeits.push({
      id: row.id as string,
      challengeId: landing.id,
      challengeSlug: landing.slug,
      owedToName: owedTo?.display_name ?? "them",
      kind: row.kind as string,
      call: formatCall(landing),
    });
  }

  const games = await listGamesForCreate(
    {
      league: null,
      from: now,
      to:
        tonightEnd.getTime() > now.getTime()
          ? tonightEnd
          : new Date(now.getTime() + 24 * 3600_000),
    },
    { sync: true },
  );

  const tonightQuickCalls: TonightQuickCall[] = games.slice(0, 6).map((game) => ({
    gameId: game.id,
    label: `${game.awayTeam.abbr} at ${game.homeTeam.abbr}`,
    league: game.league,
    startsAt: game.startsAt,
    homeAbbr: game.homeTeam.abbr,
    awayAbbr: game.awayTeam.abbr,
    homeColor: game.homeTeam.primaryColor,
    awayColor: game.awayTeam.primaryColor,
    defaultMarket: "spread",
    defaultPick: "home",
    defaultLine: defaultLine("spread"),
  }));

  return { live, owedForfeits, openWaiting, tonightQuickCalls };
}

export function formatHomeForfeitLine(item: HomeOwedForfeit): string {
  return `${item.call} · owe ${item.owedToName}`;
}

/** Bucket a challenge for Home ordering (unit-tested). */
export function bucketHomeChallenge(
  challenge: { state: string; creator: { id: string } },
  viewerId: string,
): "live" | "openWaiting" | null {
  if (challenge.state === "live" || challenge.state === "accepted") {
    return "live";
  }
  if (challenge.state === "open" && challenge.creator.id === viewerId) {
    return "openWaiting";
  }
  return null;
}
