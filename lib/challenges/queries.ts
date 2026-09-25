import type { ChallengeLanding } from "@/lib/challenges/types";
import { hydrateChallengeRow } from "@/lib/challenges/hydrate";
import { createServiceClient } from "@/lib/supabase/service";

const CHALLENGE_SELECT = `
  id,
  slug,
  state,
  market,
  creator_pick,
  line,
  quarter,
  forfeit_kind,
  forfeit_text,
  outcome,
  accepted_at,
  settled_at,
  creator:profiles!challenges_creator_id_fkey (
    id, handle, display_name, avatar_url
  ),
  opponent:profiles!challenges_opponent_id_fkey (
    id, handle, display_name, avatar_url
  ),
  game:games (
    id,
    league,
    starts_at,
    status,
    period,
    clock,
    home_score,
    away_score,
    period_scores,
    updated_at,
    home_team,
    away_team
  )
`;

/** Public challenge landing data — service role, display fields only (BUILD). */
export async function getChallengeBySlug(
  slug: string,
): Promise<ChallengeLanding | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return hydrateChallengeRow(data as Record<string, unknown>);
}
