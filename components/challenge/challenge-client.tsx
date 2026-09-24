"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { copy } from "@/lib/copy";
import type { ChallengeLanding, ChallengeView } from "@/lib/challenges/types";
import type { ViewerProfile } from "@/lib/auth/profile";
import { ChallengeShell } from "@/components/challenge/challenge-shell";
import { ChallengeHero } from "@/components/challenge/challenge-hero";
import { ScoreStrip } from "@/components/challenge/score-strip";
import { SignInSheet } from "@/components/auth/sign-in-sheet";
import { Button } from "@/components/ui/button";
import { voidReason } from "@/lib/challenges/views";

type ChallengeClientProps = {
  challenge: ChallengeLanding;
  view: ChallengeView;
  viewer: ViewerProfile | null;
  demoMode?: boolean;
};

export function ChallengeClient({
  challenge,
  view: initialView,
  viewer,
  demoMode = false,
}: ChallengeClientProps) {
  const router = useRouter();
  const [view, setView] = useState<ChallengeView>(initialView);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInMode, setSignInMode] = useState<"sign-in" | "adult-only">(
    "sign-in",
  );
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const acceptChallenge = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/challenges/${challenge.id}/accept`, {
      method: "POST",
    });
    const body = (await res.json()) as {
      ok?: boolean;
      reason?: string;
    };
    setLoading(false);

    if (res.ok && body.ok) {
      setAccepted(true);
      setView("live");
      router.refresh();
      return;
    }

    if (body.reason === "taken") {
      setView("taken");
      return;
    }

    if (body.reason === "adult_required" || body.reason === "unauthorized") {
      setSignInMode(body.reason === "adult_required" ? "adult-only" : "sign-in");
      setShowSignIn(true);
      return;
    }

    setError(
      body.reason === "own_challenge"
        ? "You can't accept your own challenge."
        : body.reason === "past_kickoff"
          ? "Kickoff already passed."
          : "Could not accept. Try again.",
    );
  }, [challenge.id, router]);

  function handleImIn() {
    if (demoMode) {
      return;
    }
    if (!viewer) {
      setSignInMode("sign-in");
      setShowSignIn(true);
      return;
    }
    if (!viewer.adultConfirmedAt) {
      setSignInMode("adult-only");
      setShowSignIn(true);
      return;
    }
    void acceptChallenge();
  }

  function handleAuthComplete() {
    router.refresh();
    void acceptChallenge();
  }

  async function handleRematch() {
    setLoading(true);
    const res = await fetch(`/api/challenges/${challenge.id}/rematch`, {
      method: "POST",
    });
    const body = (await res.json()) as {
      ok?: boolean;
      prefill?: Record<string, unknown>;
    };
    setLoading(false);
    if (res.ok && body.ok && body.prefill) {
      sessionStorage.setItem(
        "waygr-create-prefill",
        JSON.stringify(body.prefill),
      );
      router.push("/");
      return;
    }
    setError("No rematch game found. Pick one yourself.");
  }

  function handleMakeYourOwn() {
    router.push("/");
  }

  const voidCopy = () => {
    const reason = voidReason(challenge);
    if (reason === "expired") {
      return "This challenge expired at kickoff.";
    }
    return copy.result.void;
  };

  return (
    <>
      <ChallengeShell
        footer={
          view === "open" && !accepted ? (
            <div className="flex flex-col gap-3">
              {error ? (
                <p className="text-center text-sm text-[var(--rose)]">{error}</p>
              ) : null}
              <Button
                onClick={handleImIn}
                disabled={loading || demoMode}
                className="w-full"
              >
                {copy.challenge.accept}
              </Button>
              <Button variant="ghost" className="w-full">
                {copy.challenge.decline}
              </Button>
            </div>
          ) : undefined
        }
      >
        {view === "open" && !accepted && <ChallengeHero challenge={challenge} />}

        {view === "open" && accepted && (
          <section className="space-y-4 text-center">
            <p className="font-[family-name:var(--font-barlow)] text-4xl font-extrabold text-[var(--green)]">
              {copy.challenge.accepted}
            </p>
            <ScoreStrip challenge={challenge} />
          </section>
        )}

        {view === "taken" && (
          <section className="space-y-6 text-center">
            <p className="font-[family-name:var(--font-barlow)] text-3xl font-extrabold">
              {copy.challenge.tooSlow(
                challenge.opponent?.displayName ?? "Someone",
              )}
            </p>
            <Button className="mx-auto" onClick={handleMakeYourOwn}>
              {copy.challenge.makeYourOwn}
            </Button>
          </section>
        )}

        {view === "live" && (
          <section className="space-y-6">
            <ScoreStrip challenge={challenge} />
            <ChallengeHero challenge={challenge} />
            <p className="text-center text-[var(--muted)]">
              {challenge.game.status === "live"
                ? copy.live.youUp
                : copy.challenge.accepted}
            </p>
          </section>
        )}

        {view === "settled" && (
          <section className="space-y-6 text-center">
            <ScoreStrip challenge={challenge} />
            <p className="font-[family-name:var(--font-barlow)] text-4xl font-extrabold">
              {challenge.outcome === "push"
                ? copy.result.push
                : viewer &&
                    ((challenge.outcome === "creator" &&
                      viewer.id === challenge.creator.id) ||
                      (challenge.outcome === "opponent" &&
                        viewer.id === challenge.opponent?.id))
                  ? copy.result.win
                  : copy.result.loss}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => void handleRematch()} disabled={loading}>
                {copy.result.rematch}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const url = `${window.location.origin}/c/${challenge.slug}`;
                  void navigator.clipboard?.writeText(url);
                }}
              >
                Share
              </Button>
            </div>
          </section>
        )}

        {view === "void" && (
          <section className="space-y-6 text-center">
            <p className="font-[family-name:var(--font-barlow)] text-3xl font-extrabold">
              {voidCopy()}
            </p>
            <Button className="mx-auto" onClick={handleMakeYourOwn}>
              {copy.challenge.makeYourOwn}
            </Button>
          </section>
        )}
      </ChallengeShell>

      {!demoMode && (
        <SignInSheet
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          mode={signInMode}
          onComplete={handleAuthComplete}
        />
      )}
    </>
  );
}
