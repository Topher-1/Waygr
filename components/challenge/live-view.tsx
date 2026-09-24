"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChallengeHero } from "@/components/challenge/challenge-hero";
import { ChallengeMeter } from "@/components/challenge/challenge-meter";
import { ScoreStrip } from "@/components/challenge/score-strip";
import { TrashTalk } from "@/components/challenge/trash-talk";
import { copy } from "@/lib/copy";
import { computeChallengeMeter } from "@/lib/challenges/meter";
import { useChallengeLive } from "@/lib/challenges/use-challenge-live";
import type { ChallengeLanding } from "@/lib/challenges/types";
import type { ViewerProfile } from "@/lib/auth/profile";

type LiveViewProps = {
  challenge: ChallengeLanding;
  viewer: ViewerProfile | null;
  demoMode?: boolean;
};

export function LiveView({
  challenge,
  viewer,
  demoMode = false,
}: LiveViewProps) {
  const router = useRouter();
  const handleSettled = useCallback(() => {
    router.refresh();
  }, [router]);

  const { game, scoreStale } = useChallengeLive({
    challenge,
    enabled: !demoMode && viewer !== null,
    onSettled: handleSettled,
  });

  const meter = useMemo(() => {
    if (!viewer) {
      return null;
    }
    return computeChallengeMeter(challenge, game, viewer.id);
  }, [challenge, game, viewer]);

  const opponent = challenge.opponent;
  const statusLine = useMemo(() => {
    if (game.status !== "live") {
      return copy.challenge.accepted;
    }
    if (!viewer || !opponent || !meter) {
      return copy.challenge.accepted;
    }
    if (meter.ahead === "tied") {
      return copy.live.tied;
    }
    if (meter.ahead === "viewer") {
      return copy.live.youUp;
    }
    return copy.live.theyUp(opponent.displayName);
  }, [game.status, meter, opponent, viewer]);

  return (
    <section className="space-y-6">
      <ScoreStrip game={game} stale={scoreStale} />
      {meter ? <ChallengeMeter meter={meter} /> : null}
      <ChallengeHero challenge={challenge} />
      <p className="text-center text-[var(--muted)]">{statusLine}</p>
      {viewer && opponent ? (
        <TrashTalk
          challengeId={challenge.id}
          viewer={viewer}
          creator={challenge.creator}
          opponent={opponent}
          demoMode={demoMode}
        />
      ) : null}
    </section>
  );
}
