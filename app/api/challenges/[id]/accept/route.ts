import { NextResponse } from "next/server";
import { validateAccept } from "@/lib/challenges/accept";
import { ensureProfileForUser, getViewerProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id: challengeId } = await context.params;

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

  const service = createServiceClient();

  const { data: challenge, error: fetchError } = await service
    .from("challenges")
    .select(
      `
      id,
      state,
      creator_id,
      opponent_id,
      game:games ( status )
    `,
    )
    .eq("id", challengeId)
    .maybeSingle();

  if (fetchError || !challenge) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const gameRow = challenge.game as { status: string } | { status: string }[];
  const game = Array.isArray(gameRow) ? gameRow[0] : gameRow;
  if (!game?.status) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }
  const now = new Date();

  const validation = validateAccept({
    challengeState: challenge.state,
    creatorId: challenge.creator_id,
    opponentId: challenge.opponent_id,
    gameStatus: game.status,
    actorProfileId: profile.id,
    adultConfirmedAt: profile.adultConfirmedAt
      ? new Date(profile.adultConfirmedAt)
      : null,
  });

  if (!validation.ok) {
    const status =
      validation.reason === "unauthorized"
        ? 401
        : validation.reason === "not_found"
          ? 404
          : 409;
    return NextResponse.json(
      { ok: false, reason: validation.reason },
      { status },
    );
  }

  const { data: result, error: rpcError } = await service.rpc(
    "accept_challenge_atomic",
    {
      p_challenge_id: challengeId,
      p_opponent_id: profile.id,
      p_accepted_at: now.toISOString(),
      p_referred_by: challenge.creator_id,
    },
  );

  if (rpcError) {
    return NextResponse.json(
      { ok: false, reason: "conflict" },
      { status: 500 },
    );
  }

  const payload = result as { accepted?: boolean; reason?: string };

  if (!payload.accepted) {
    const reason = payload.reason ?? "conflict";
    return NextResponse.json({ ok: false, reason }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
