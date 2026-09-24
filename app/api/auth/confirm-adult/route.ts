import { NextResponse } from "next/server";
import { confirmAdult, ensureProfileForUser, getViewerProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let profile = await getViewerProfile();
  if (!profile) {
    profile = await ensureProfileForUser(user);
  }

  if (profile.adultConfirmedAt) {
    return NextResponse.json({ ok: true });
  }

  await confirmAdult(profile.id);
  return NextResponse.json({ ok: true });
}
