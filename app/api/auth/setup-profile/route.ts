import { NextResponse } from "next/server";
import { ensureProfileForUser } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

/** Ensure a profiles row exists after email sign-up / sign-in. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await ensureProfileForUser(user);

  return NextResponse.json({
    profile: {
      id: profile.id,
      handle: profile.handle,
      displayName: profile.displayName,
      adultConfirmedAt: profile.adultConfirmedAt,
    },
  });
}
