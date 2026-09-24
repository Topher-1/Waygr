"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import type { ViewerProfile } from "@/lib/auth/profile";
import type { HomeFeed } from "@/lib/challenges/home-queries";
import { formatHomeForfeitLine } from "@/lib/challenges/home-queries";
import { formatCall, formatKickoff, formatMatchup } from "@/lib/challenges/format";
import { Button } from "@/components/ui/button";
import { SignInSheet } from "@/components/auth/sign-in-sheet";
import { CreateSheet, type CreatePrefill } from "@/components/create/create-sheet";
import { ScoreStrip } from "@/components/challenge/score-strip";

type HomeClientProps = {
  viewer: ViewerProfile | null;
  feed: HomeFeed | null;
};

export function HomeClient({ viewer, feed }: HomeClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [prefill, setPrefill] = useState<CreatePrefill | null>(null);
  const [quickGameId, setQuickGameId] = useState<string | null>(null);

  const openCreate = useCallback((opts?: { prefill?: CreatePrefill; gameId?: string }) => {
    if (!viewer) {
      setShowSignIn(true);
      return;
    }
    if (!viewer.adultConfirmedAt) {
      setShowSignIn(true);
      return;
    }
    setPrefill(opts?.prefill ?? null);
    setQuickGameId(opts?.gameId ?? null);
    setShowCreate(true);
  }, [viewer]);

  useEffect(() => {
    const stored = sessionStorage.getItem("waygr-create-prefill");
    if (stored) {
      sessionStorage.removeItem("waygr-create-prefill");
      try {
        const parsed = JSON.parse(stored) as CreatePrefill;
        openCreate({ prefill: parsed });
      } catch {
        // ignore
      }
    }
  }, [openCreate]);

  async function handleCancel(challengeId: string) {
    const res = await fetch(`/api/challenges/${challengeId}/cancel`, {
      method: "POST",
    });
    if (res.ok) {
      window.location.reload();
    }
  }

  const tonightLabel =
    feed?.tonightQuickCalls[0]?.label ?? "Check tonight's slate";

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-28 pt-6">
        <h1
          className="mb-6 font-[family-name:var(--font-barlow)] text-3xl font-extrabold italic text-[var(--orange-strong)]"
        >
          {copy.appName}
        </h1>

        {!viewer && (
          <p className="mb-6 text-[var(--muted)]">
            {copy.home.empty(tonightLabel)}
          </p>
        )}

        {viewer && feed && (
          <div className="flex flex-col gap-8">
            {feed.live.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {copy.home.live}
                </h2>
                <ul className="space-y-3">
                  {feed.live.map((challenge) => (
                    <li key={challenge.id}>
                      <Link
                        href={`/c/${challenge.slug}`}
                        className="block rounded-xl border border-[var(--border)] bg-[var(--raised)] p-4"
                      >
                        <ScoreStrip game={challenge.game} />
                        <p className="mt-2 text-sm font-semibold">
                          {formatMatchup(challenge)} · {formatCall(challenge)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {feed.owedForfeits.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {copy.home.owed}
                </h2>
                <ul className="space-y-2">
                  {feed.owedForfeits.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/c/${item.challengeSlug}`}
                        className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"
                      >
                        {formatHomeForfeitLine(item)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {feed.openWaiting.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {copy.home.waiting}
                </h2>
                <ul className="space-y-2">
                  {feed.openWaiting.map((challenge) => (
                    <li
                      key={challenge.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                    >
                      <Link href={`/c/${challenge.slug}`} className="block">
                        <p className="font-semibold">{formatMatchup(challenge)}</p>
                        <p className="text-sm text-[var(--muted)]">
                          {formatCall(challenge)} · waiting
                        </p>
                      </Link>
                      <Button
                        variant="ghost"
                        className="mt-2 text-sm"
                        onClick={() => void handleCancel(challenge.id)}
                      >
                        {copy.create.cancelChallenge}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {feed.tonightQuickCalls.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {copy.home.tonight}
                </h2>
                <ul className="space-y-2">
                  {feed.tonightQuickCalls.map((game) => (
                    <li key={game.gameId}>
                      <button
                        type="button"
                        onClick={() =>
                          openCreate({
                            gameId: game.gameId,
                            prefill: {
                              gameId: game.gameId,
                              market: game.defaultMarket,
                              creatorPick: game.defaultPick,
                              line: game.defaultLine,
                              forfeitKind: "concession",
                            },
                          })
                        }
                        className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3 text-left"
                      >
                        <span
                          className="h-6 w-1 rounded-full"
                          style={{ background: game.awayColor }}
                        />
                        <span
                          className="h-6 w-1 rounded-full"
                          style={{ background: game.homeColor }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold">{game.label}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {game.league.toUpperCase()} · {formatKickoff(game.startsAt)}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[var(--orange)]">
                          {copy.home.quickCall}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {feed.live.length === 0 &&
              feed.owedForfeits.length === 0 &&
              feed.openWaiting.length === 0 &&
              feed.tonightQuickCalls.length === 0 && (
                <p className="text-[var(--muted)]">{copy.home.empty(tonightLabel)}</p>
              )}
          </div>
        )}

        <Link
          href="/demo"
          className="mt-8 text-center text-sm text-[var(--muted)] underline-offset-2 hover:underline"
        >
          Preview challenge views
        </Link>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] p-4">
        <Button className="w-full max-w-lg mx-auto block" onClick={() => openCreate()}>
          {copy.home.makeCall}
        </Button>
      </div>

      <CreateSheet
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setPrefill(null);
          setQuickGameId(null);
        }}
        prefill={prefill}
        quickGameId={quickGameId}
        onCreated={() => {
          // keep sheet open for share step
        }}
      />

      <SignInSheet
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        mode={viewer && !viewer.adultConfirmedAt ? "adult-only" : "sign-in"}
        onComplete={() => {
          setShowSignIn(false);
          window.location.reload();
        }}
      />
    </>
  );
}
