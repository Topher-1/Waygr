"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { copy } from "@/lib/copy";
import type { ChallengeLanding, ChallengeView } from "@/lib/challenges/types";
import type { ViewerProfile } from "@/lib/auth/profile";
import { ChallengeShell } from "@/components/challenge/challenge-shell";
import { ChallengeHero } from "@/components/challenge/challenge-hero";
import { LiveView } from "@/components/challenge/live-view";
import { ScoreStrip } from "@/components/challenge/score-strip";
import { SignInSheet } from "@/components/auth/sign-in-sheet";
import { Button } from "@/components/ui/button";
import { BusyButton } from "@/components/ui/busy-button";
import { shareChallengeLink } from "@/lib/challenges/share-challenge";
import { voidReason } from "@/lib/challenges/views";
import { CancelCallSheet } from "@/components/home/cancel-call-sheet";
import { formatMatchup } from "@/lib/challenges/format";
import { cardFileName, cardPath } from "@/lib/cards/content";
import { shareCardImage } from "@/lib/share/share-card";
import { resolveForfeitRole } from "@/lib/forfeits/actions";
import type { ForfeitKind, ForfeitStatus } from "@/lib/jobs/types";

export type ChallengeForfeit = {
  id: string;
  kind: ForfeitKind;
  status: ForfeitStatus;
  owedBy: string;
  owedTo: string;
};

type ChallengeClientProps = {
  challenge: ChallengeLanding;
  view: ChallengeView;
  viewer: ViewerProfile | null;
  forfeit?: ChallengeForfeit | null;
  demoMode?: boolean;
};

export function ChallengeClient({
  challenge,
  view: initialView,
  viewer,
  forfeit = null,
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
  const [sharingCard, setSharingCard] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const viewerWon =
    viewer !== null &&
    ((challenge.outcome === "creator" && viewer.id === challenge.creator.id) ||
      (challenge.outcome === "opponent" && viewer.id === challenge.opponent?.id));

  const forfeitRole = forfeit ? resolveForfeitRole(forfeit, viewer?.id ?? null) : null;

  const forfeitAction =
    forfeit &&
    forfeitRole === "loser" &&
    (forfeit.status === "owed" || forfeit.status === "proof_submitted")
      ? {
          id: forfeit.id,
          label:
            forfeit.status === "proof_submitted"
              ? copy.forfeit.viewStatus
              : copy.forfeit.settleAction,
        }
      : forfeit && forfeitRole === "winner" && forfeit.status === "proof_submitted"
        ? { id: forfeit.id, label: copy.forfeit.proofReview }
        : null;

  const acceptChallenge = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/accept`, {
        method: "POST",
      });
      const body = (await res.json()) as {
        ok?: boolean;
        reason?: string;
      };

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
        setSignInMode(
          body.reason === "adult_required" ? "adult-only" : "sign-in",
        );
        setShowSignIn(true);
        return;
      }

      setError(
        body.reason === "own_challenge"
          ? "You can't accept your own challenge."
          : body.reason === "game_over"
            ? "This game is over — can't accept now."
            : "Could not accept. Try again.",
      );
    } finally {
      setLoading(false);
    }
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
    setError(null);
    const res = await fetch(`/api/challenges/${challenge.id}/rematch`, {
      method: "POST",
    });
    const body = (await res.json()) as {
      ok?: boolean;
      prefill?: Record<string, unknown>;
    };
    if (res.ok && body.ok && body.prefill) {
      sessionStorage.setItem(
        "waygr-create-prefill",
        JSON.stringify(body.prefill),
      );
      router.push("/");
      return;
    }
    setLoading(false);
    setError("No rematch game found. Pick one yourself.");
  }

  function handleMakeYourOwn() {
    router.push("/");
  }

  function handleDecline() {
    router.push("/");
  }

  async function handleShareResult() {
    if (demoMode || sharingCard) return;
    setSharingCard(true);
    setShareNote(null);
    try {
      const result = await shareCardImage({
        url: cardPath(challenge.slug, "called", "post"),
        fileName: cardFileName(challenge.slug, "called", "post"),
        title: copy.appName,
        text: `${window.location.origin}/c/${challenge.slug}`,
      });
      setShareNote(
        result === "failed"
          ? copy.forfeit.shareFailed
          : result === "dismissed"
            ? null
            : copy.result.shared,
      );
    } finally {
      setSharingCard(false);
    }
  }

  async function handleWaitingShare() {
    if (sharing) return;
    setSharing(true);
    setLinkCopied(false);
    const url = `${window.location.origin}/c/${challenge.slug}`;
    try {
      const result = await shareChallengeLink({
        title: copy.appName,
        text: `${challenge.creator.displayName} has a waygr on the line.`,
        url,
      });
      if (result === "copied") {
        setLinkCopied(true);
      }
    } finally {
      setSharing(false);
    }
  }

  async function handleCancelConfirm() {
    const res = await fetch(`/api/challenges/${challenge.id}/cancel`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error("cancel_failed");
    }
    router.push("/");
    router.refresh();
  }

  const shareLoadingLabel =
    typeof navigator !== "undefined" && "share" in navigator
      ? copy.create.sharing
      : copy.create.copying;

  const voidCopy = () => {
    const reason = voidReason(challenge);
    if (reason === "expired") {
      return "This challenge expired at kickoff.";
    }
    return copy.result.void;
  };

  const showHomeEscape = view === "live" || (view === "open" && accepted);

  return (
    <>
      <ChallengeShell
        footer={
          view === "waiting" ? (
            <div className="flex flex-col gap-3">
              <BusyButton
                onClick={() => void handleWaitingShare()}
                loading={sharing}
                loadingLabel={shareLoadingLabel}
                disabled={demoMode}
                className="w-full"
              >
                {copy.create.share}
              </BusyButton>
              {linkCopied ? (
                <p className="text-center text-sm text-[var(--green)]">
                  {copy.create.linkCopied}
                </p>
              ) : null}
              <Button
                variant="ghost"
                className="w-full"
                disabled={sharing}
                onClick={() => setShowCancel(true)}
              >
                {copy.home.cancelCall}
              </Button>
              <Link
                href="/"
                className="block w-full rounded-xl border border-[var(--border)] bg-[var(--raised)] px-5 py-3 text-center text-base font-semibold text-[var(--text)] transition-opacity hover:bg-[var(--surface)]"
              >
                {copy.home.makeCall}
              </Link>
            </div>
          ) : view === "open" && !accepted ? (
            <div className="flex flex-col gap-3">
              {error ? (
                <p className="text-center text-sm text-[var(--rose)]">{error}</p>
              ) : null}
              <BusyButton
                onClick={handleImIn}
                loading={loading}
                loadingLabel={copy.challenge.accepting}
                disabled={demoMode}
                className="w-full"
              >
                {copy.challenge.accept}
              </BusyButton>
              <Button
                variant="ghost"
                className="w-full"
                disabled={loading}
                onClick={handleDecline}
              >
                {copy.challenge.decline}
              </Button>
            </div>
          ) : showHomeEscape ? (
            <Link
              href="/"
              className="block w-full rounded-xl border border-[var(--border)] bg-[var(--raised)] px-5 py-3 text-center text-base font-semibold text-[var(--text)] transition-opacity hover:bg-[var(--surface)]"
            >
              {copy.live.backHome}
            </Link>
          ) : undefined
        }
      >
        {view === "waiting" && (
          <section className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              {copy.challenge.waitingStatus}
            </p>
            <ChallengeHero challenge={challenge} mode="waiting" />
          </section>
        )}

        {view === "open" && !accepted && <ChallengeHero challenge={challenge} />}

        {view === "open" && accepted && (
          <section className="space-y-4 text-center">
            <p className="font-[family-name:var(--font-barlow)] text-4xl font-extrabold text-[var(--green)]">
              {copy.challenge.accepted}
            </p>
            <ScoreStrip game={challenge.game} />
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
          <LiveView
            challenge={challenge}
            viewer={viewer}
            demoMode={demoMode}
          />
        )}

        {view === "settled" && (
          <section className="space-y-6 text-center">
            <ScoreStrip game={challenge.game} />
            <p className="font-[family-name:var(--font-barlow)] text-4xl font-extrabold">
              {challenge.outcome === "push"
                ? copy.result.push
                : viewerWon
                  ? copy.result.win
                  : copy.result.loss}
            </p>
            <div className="flex flex-col gap-3">
              {forfeitAction ? (
                <Button onClick={() => router.push(`/f/${forfeitAction.id}`)}>
                  {forfeitAction.label}
                </Button>
              ) : null}
              <BusyButton
                variant={forfeitAction ? "secondary" : "primary"}
                onClick={() => void handleRematch()}
                loading={loading}
                loadingLabel={copy.result.rematching}
              >
                {copy.result.rematch}
              </BusyButton>
              <BusyButton
                variant="secondary"
                loading={sharingCard}
                loadingLabel={copy.result.sharing}
                disabled={loading}
                onClick={() => void handleShareResult()}
              >
                {copy.result.share}
              </BusyButton>
              {shareNote ? (
                <p role="status" className="text-sm text-[var(--muted)]">
                  {shareNote}
                </p>
              ) : null}
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
        <>
          <SignInSheet
            open={showSignIn}
            onClose={() => setShowSignIn(false)}
            mode={signInMode}
            onComplete={handleAuthComplete}
          />
          <CancelCallSheet
            open={showCancel}
            matchup={formatMatchup(challenge)}
            onClose={() => setShowCancel(false)}
            onConfirm={handleCancelConfirm}
          />
        </>
      )}
    </>
  );
}
