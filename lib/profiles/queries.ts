/**
 * Public profile reads for /u/[handle] and /r/[handle].
 * Service role, display fields only, same rule as the challenge landing
 * (BUILD · Data model / RLS).
 */
import { createServiceClient } from "@/lib/supabase/service";
import {
  computeProfileStats,
  type ProfileChallenge,
  type ProfileForfeit,
  type ProfileStats,
} from "@/lib/profiles/stats";
import {
  listSettledWaygrs,
  type SettledWaygr,
} from "@/lib/challenges/settled-history";
import { listTopRivalries } from "@/lib/rivalry/queries";
import type { RivalrySummary } from "@/lib/rivalry/record";

export type PublicProfile = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  jerseyTeam: string | null;
  jerseyUntil: string | null;
  deletedAt: string | null;
};

export type ProfilePage = {
  profile: PublicProfile;
  stats: ProfileStats;
  rivalries: RivalrySummary[];
  settledWaygrs: SettledWaygr[];
};

function mapProfile(row: Record<string, unknown>): PublicProfile {
  return {
    id: row.id as string,
    handle: row.handle as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    jerseyTeam: (row.jersey_team as string | null) ?? null,
    jerseyUntil: (row.jersey_until as string | null) ?? null,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

const PROFILE_COLUMNS =
  "id, handle, display_name, avatar_url, jersey_team, jersey_until, deleted_at";

export async function getProfileByHandle(
  handle: string,
): Promise<PublicProfile | null> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("handle", handle)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data);
}

export async function getProfileById(
  id: string,
): Promise<PublicProfile | null> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data);
}

/** Everything /u/[handle] renders. */
export async function getProfilePage(
  handle: string,
): Promise<ProfilePage | null> {
  const profile = await getProfileByHandle(handle);
  if (!profile) return null;

  const service = createServiceClient();

  const { data: challengeRows } = await service
    .from("challenges")
    .select("creator_id, opponent_id, outcome, state")
    .eq("state", "settled")
    .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id}`);

  const challenges: ProfileChallenge[] = (challengeRows ?? []).map((row) => ({
    creatorId: row.creator_id as string,
    opponentId: (row.opponent_id as string | null) ?? null,
    outcome: row.outcome as ProfileChallenge["outcome"],
    state: row.state as string,
  }));

  const { data: forfeitRows } = await service
    .from("forfeits")
    .select("owed_by, status")
    .eq("owed_by", profile.id);

  const forfeits: ProfileForfeit[] = (forfeitRows ?? []).map((row) => ({
    owedBy: row.owed_by as string,
    status: row.status as ProfileForfeit["status"],
  }));

  const stats = computeProfileStats(challenges, forfeits, profile.id);
  const rivalries = await listTopRivalries(profile.id);
  const settledWaygrs = await listSettledWaygrs(profile.id, 12);

  return { profile, stats, rivalries, settledWaygrs };
}
