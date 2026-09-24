"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChallengeLanding, ChallengeLandingGame } from "@/lib/challenges/types";
import {
  mapRealtimeChallengeRow,
  mapRealtimeGameRow,
} from "@/lib/challenges/live-realtime";
import { isScoreFeedStale } from "@/lib/challenges/meter";

type UseChallengeLiveOptions = {
  challenge: ChallengeLanding;
  enabled: boolean;
  onSettled?: () => void;
};

type UseChallengeLiveResult = {
  game: ChallengeLandingGame;
  challengeState: string;
  scoreStale: boolean;
};

export function useChallengeLive({
  challenge,
  enabled,
  onSettled,
}: UseChallengeLiveOptions): UseChallengeLiveResult {
  const [game, setGame] = useState(challenge.game);
  const [challengeState, setChallengeState] = useState(challenge.state);
  const [scoreStale, setScoreStale] = useState(false);

  useEffect(() => {
    setGame(challenge.game);
    setChallengeState(challenge.state);
  }, [challenge.game, challenge.state]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const supabase = createClient();
    const gameChannel = supabase
      .channel(`live-game-${challenge.game.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${challenge.game.id}`,
        },
        (payload) => {
          setGame((current) =>
            mapRealtimeGameRow(payload.new as never, {
              ...current,
              homeTeam: challenge.game.homeTeam,
              awayTeam: challenge.game.awayTeam,
            }),
          );
        },
      )
      .subscribe();

    const challengeChannel = supabase
      .channel(`live-challenge-${challenge.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "challenges",
          filter: `id=eq.${challenge.id}`,
        },
        (payload) => {
          const next = mapRealtimeChallengeRow(payload.new as never);
          setChallengeState(next.state);
          if (next.state === "settled" || next.state === "void") {
            onSettled?.();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(gameChannel);
      void supabase.removeChannel(challengeChannel);
    };
  }, [
    challenge.game.awayTeam,
    challenge.game.homeTeam,
    challenge.game.id,
    challenge.id,
    enabled,
    onSettled,
  ]);

  useEffect(() => {
    const tick = () => {
      setScoreStale(isScoreFeedStale(game));
    };
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, [game]);

  return { game, challengeState, scoreStale };
}
