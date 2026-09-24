import { NextResponse } from "next/server";
import { getViewerProfile } from "@/lib/auth/profile";
import {
  buildRematchPrefill,
  findNextGameForRematch,
  type RematchSource,
} from "@/lib/challenges/rematch";
import { listScheduledGames } from "@/lib/games/sync";
import { createServiceClient } from "@/lib/supabase/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id: challengeId } = await context.params;
  const profile = await getViewerProfile();

  if (!profile) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: challenge, error } = await service
    .from("challenges")
    .select(
      `
      id,
      market,
      creator_pick,
      line,
      quarter,
      forfeit_kind,
      forfeit_text,
      creator_id,
      opponent_id,
      game:games ( home_team, away_team, starts_at )
    `,
    )
    .eq("id", challengeId)
    .maybeSingle();

  if (error || !challenge) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const isParticipant =
    challenge.creator_id === profile.id ||
    challenge.opponent_id === profile.id;

  if (!isParticipant) {
    return NextResponse.json({ ok: false, reason: "not_participant" }, { status: 403 });
  }

  const gameRaw = challenge.game as
    | { home_team: string; away_team: string; starts_at: string }
    | { home_team: string; away_team: string; starts_at: string }[];
  const game = Array.isArray(gameRaw) ? gameRaw[0] : gameRaw;
  if (!game) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const now = new Date();
  const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const candidates = await listScheduledGames(now, to);

  const source: RematchSource = {
    id: challenge.id,
    market: challenge.market as RematchSource["market"],
    creatorPick: challenge.creator_pick as RematchSource["creatorPick"],
    line: challenge.line === null ? null : Number(challenge.line),
    quarter: challenge.quarter,
    forfeitKind: challenge.forfeit_kind as RematchSource["forfeitKind"],
    forfeitText: challenge.forfeit_text,
    game: {
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      startsAt: game.starts_at,
    },
  };

  const nextGame = findNextGameForRematch(source, candidates, now);
  if (!nextGame) {
    return NextResponse.json({ ok: false, reason: "no_next_game" }, { status: 404 });
  }

  const prefill = buildRematchPrefill(source, nextGame);
  return NextResponse.json({ ok: true, prefill });
}
