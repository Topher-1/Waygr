import { NextResponse } from "next/server";
import { ensureProfileForUser, getViewerProfile } from "@/lib/auth/profile";
import { validateCreate } from "@/lib/challenges/create";
import { generateChallengeSlug } from "@/lib/challenges/slug";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  let profile = await getViewerProfile();
  if (!profile) {
    profile = await ensureProfileForUser(user);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const service = createServiceClient();

  const { data: game, error: gameError } = await service
    .from("games")
    .select("id, status")
    .eq("id", body.gameId as string)
    .maybeSingle();

  if (gameError || !game) {
    return NextResponse.json({ ok: false, reason: "game_not_found" }, { status: 404 });
  }

  const validation = validateCreate(body, {
    gameStatus: game.status,
    adultConfirmedAt: profile.adultConfirmedAt
      ? new Date(profile.adultConfirmedAt)
      : null,
  });

  if (!validation.ok) {
    const status =
      validation.reason === "unauthorized"
        ? 401
        : validation.reason === "adult_required"
          ? 403
          : validation.reason === "game_not_found"
            ? 404
            : 409;
    return NextResponse.json(
      { ok: false, reason: validation.reason },
      { status },
    );
  }

  const payload = validation.payload;
  let slug = generateChallengeSlug();
  let inserted: { slug: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("challenges")
      .insert({
        slug,
        creator_id: profile.id,
        game_id: payload.gameId,
        market: payload.market,
        creator_pick: payload.creatorPick,
        line: payload.line,
        quarter: payload.quarter,
        forfeit_kind: payload.forfeitKind,
        forfeit_text: payload.forfeitText,
        rematch_of: payload.rematchOf,
        state: "open",
      })
      .select("slug")
      .single();

    if (!error && data) {
      inserted = data;
      break;
    }
    if (error?.code === "23505") {
      slug = generateChallengeSlug();
      continue;
    }
    return NextResponse.json(
      { ok: false, reason: "create_failed" },
      { status: 500 },
    );
  }

  if (!inserted) {
    return NextResponse.json(
      { ok: false, reason: "create_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, slug: inserted.slug });
}
