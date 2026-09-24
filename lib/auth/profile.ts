import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function slugifyHandle(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "player"}${suffix}`;
}

export type ViewerProfile = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  adultConfirmedAt: string | null;
};

/** Current user's profile row, or null if signed out / no profile yet. */
export async function getViewerProfile(): Promise<ViewerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, adult_confirmed_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    handle: data.handle,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    adultConfirmedAt: data.adult_confirmed_at,
  };
}

/** Create or refresh profile after email sign-up / sign-in. */
export async function ensureProfileForUser(user: {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<ViewerProfile> {
  const service = createServiceClient();

  const { data: existing } = await service
    .from("profiles")
    .select("id, handle, display_name, avatar_url, adult_confirmed_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      handle: existing.handle,
      displayName: existing.display_name,
      avatarUrl: existing.avatar_url,
      adultConfirmedAt: existing.adult_confirmed_at,
    };
  }

  const meta = user.user_metadata ?? {};
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Player";

  const avatarUrl =
    typeof meta.avatar_url === "string" ? meta.avatar_url : null;

  let handle = slugifyHandle(displayName);
  for (let i = 0; i < 5; i++) {
    const { data: inserted, error } = await service
      .from("profiles")
      .insert({
        auth_user_id: user.id,
        handle,
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .select("id, handle, display_name, avatar_url, adult_confirmed_at")
      .single();

    if (!error && inserted) {
      return {
        id: inserted.id,
        handle: inserted.handle,
        displayName: inserted.display_name,
        avatarUrl: inserted.avatar_url,
        adultConfirmedAt: inserted.adult_confirmed_at,
      };
    }

    if (error?.code === "23505") {
      handle = slugifyHandle(displayName);
      continue;
    }
    throw error ?? new Error("Failed to create profile");
  }

  throw new Error("Failed to create profile after retries");
}

/** Mark 21+ confirmed — required before first create or accept. */
export async function confirmAdult(profileId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ adult_confirmed_at: new Date().toISOString() })
    .eq("id", profileId)
    .eq("auth_user_id", user.id);

  if (error) {
    throw error;
  }
}
