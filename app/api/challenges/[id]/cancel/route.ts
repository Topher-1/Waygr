import { NextResponse } from "next/server";
import { getViewerProfile } from "@/lib/auth/profile";
import { validateCancel } from "@/lib/challenges/cancel";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id: challengeId } = await context.params;

  const profile = await getViewerProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: challenge, error: fetchError } = await supabase
    .from("challenges")
    .select("id, state, creator_id")
    .eq("id", challengeId)
    .maybeSingle();

  if (fetchError || !challenge) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const validation = validateCancel({
    challengeState: challenge.state,
    creatorId: challenge.creator_id,
    actorProfileId: profile.id,
  });

  if (!validation.ok) {
    const status =
      validation.reason === "not_creator" ? 403 : 409;
    return NextResponse.json(
      { ok: false, reason: validation.reason },
      { status },
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("challenges")
    .update({ state: "canceled" })
    .eq("id", challengeId)
    .eq("state", "open")
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    return NextResponse.json({ ok: false, reason: "not_open" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
