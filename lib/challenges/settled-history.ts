/**
 * Settled waygr history (BUILD-BRIEF · Chris 2026-09-24).
 * Lists the signed-in user's settled challenges (owed and paid), each linking to
 * /c/[slug]. Stays findable after forfeit is paid.
 */
import { formatCall, formatMatchup } from "@/lib/challenges/format";
import { hydrateChallengeRow } from "@/lib/challenges/hydrate";
import type { ChallengeLanding } from "@/lib/challenges/types";
import { createServiceClient } from "@/lib/supabase/service";
import type { ForfeitStatus } from "@/lib/jobs/types";

export type SettledWaygr = {
  id: string;
  slug: string;
  matchup: string;
  call: string;
  /** From the viewer's perspective. */
  result: "win" | "loss" | "push";
  settledAt: string;
  forfeitStatus: ForfeitStatus | "none";
};

const CHALLENGE_SELECT = `
  id, slug, state, market, creator_pick, line, quarter,
  forfeit_kind, forfeit_text, outcome, accepted_at, settled_at,
  creator_id, opponent_id,
  creator:profiles!creator_id ( id, handle, display_name, avatar_url ),
  opponent:profiles!opponent_id ( id, handle, display_name, avatar_url ),
  game:games (
    id, league, starts_at, status, period, clock, home_score, away_score,
    home_team, away_team, period_scores, updated_at
  )
`;

function viewerResult(
  challenge: ChallengeLanding,
  viewerId: string,
): SettledWaygr["result"] {
  if (challenge.outcome === "push" || !challenge.outcome) return "push";
  const won =
    (challenge.outcome === "creator" && challenge.creator.id === viewerId) ||
    (challenge.outcome === "opponent" && challenge.opponent?.id === viewerId);
  return won ? "win" : "loss";
}

/** Recent settled waygrs for a profile, newest first. */
export async function listSettledWaygrs(
  viewerId: string,
  limit = 12,
): Promise<SettledWaygr[]> {
  const service = createServiceClient();

  const { data: rows } = await service
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .eq("state", "settled")
    .or(`creator_id.eq.${viewerId},opponent_id.eq.${viewerId}`)
    .order("settled_at", { ascending: false })
    .limit(limit);

  if (!rows?.length) return [];

  const challengeIds = rows.map((row) => row.id as string);
  const { data: forfeitRows } = await service
    .from("forfeits")
    .select("challenge_id, status")
    .in("challenge_id", challengeIds);

  const forfeitByChallenge = new Map(
    (forfeitRows ?? []).map((row) => [
      row.challenge_id as string,
      row.status as ForfeitStatus,
    ]),
  );

  const items: SettledWaygr[] = [];

  for (const row of rows) {
    const challenge = hydrateChallengeRow(row as Record<string, unknown>);
    if (!challenge || !challenge.settledAt) continue;

    items.push({
      id: challenge.id,
      slug: challenge.slug,
      matchup: formatMatchup(challenge),
      call: formatCall(challenge),
      result: viewerResult(challenge, viewerId),
      settledAt: challenge.settledAt,
      forfeitStatus: forfeitByChallenge.get(challenge.id) ?? "none",
    });
  }

  return items;
}

/** One-line label for settled history rows. */
export function formatSettledWaygrLine(item: SettledWaygr): string {
  const resultLabel =
    item.result === "win"
      ? "Called it"
      : item.result === "loss"
        ? "Not your night"
        : "Push";
  const forfeitLabel =
    item.forfeitStatus === "owed"
      ? " · forfeit owed"
      : item.forfeitStatus === "proof_submitted"
        ? " · waiting on confirm"
        : item.forfeitStatus === "paid"
          ? " · square"
          : "";
  return `${item.matchup} · ${item.call} · ${resultLabel}${forfeitLabel}`;
}
