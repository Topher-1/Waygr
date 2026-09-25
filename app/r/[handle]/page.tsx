import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { copy } from "@/lib/copy";
import { APP_NAME } from "@/lib/constants";
import { getViewerProfile } from "@/lib/auth/profile";
import { getProfileByHandle } from "@/lib/profiles/queries";
import { listSettledBetween } from "@/lib/rivalry/queries";
import { computeHeadToHead } from "@/lib/rivalry/record";
import { formatKickoff } from "@/lib/challenges/format";

type PageProps = { params: Promise<{ handle: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `${APP_NAME} · @${handle}`,
    robots: { index: false, follow: false },
  };
}

/** Head-to-head record and every challenge between the two of you, newest first. */
export default async function RivalryPage({ params }: PageProps) {
  const { handle } = await params;

  const viewer = await getViewerProfile();

  let other;
  try {
    other = await getProfileByHandle(handle);
  } catch {
    notFound();
  }

  if (!other) {
    notFound();
  }

  if (!viewer) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 px-5 py-8">
        <h1 className="font-[family-name:var(--font-barlow)] text-3xl font-extrabold">
          {copy.rivalryPage.title(other.displayName)}
        </h1>
        <p className="text-[var(--muted)]">{copy.rivalryPage.signInNote}</p>
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--orange-strong)] underline-offset-2 hover:underline"
        >
          {copy.home.makeCall}
        </Link>
      </main>
    );
  }

  const challenges = await listSettledBetween(viewer.id, other.id);
  const record = computeHeadToHead(
    challenges.map((challenge) => ({
      creatorId: challenge.creatorId,
      opponentId: challenge.opponentId,
      outcome: challenge.outcome,
      settledAt: challenge.settledAt,
    })),
    viewer.id,
    other.id,
  );

  const lead =
    record.wins === record.losses
      ? copy.rivalryPage.even
      : copy.rivalry.line(
          record.wins > record.losses,
          other.displayName,
          Math.max(record.wins, record.losses),
          Math.min(record.wins, record.losses),
        );

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-5 py-8">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-barlow)] text-3xl font-extrabold">
          {copy.rivalryPage.title(other.displayName)}
        </h1>
        <p className="font-[family-name:var(--font-barlow)] text-5xl font-extrabold text-[var(--orange-strong)]">
          {copy.rivalryPage.record(record.wins, record.losses, record.pushes)}
        </p>
        <p className="text-[var(--muted)]">{lead}</p>
        <Link
          href={`/u/${other.handle}`}
          className="text-sm text-[var(--muted)] underline-offset-2 hover:underline"
        >
          @{other.handle}
        </Link>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          {copy.rivalryPage.history}
        </h2>
        {challenges.length === 0 ? (
          <p className="text-[var(--muted)]">{copy.rivalryPage.empty}</p>
        ) : (
          <ul className="space-y-2">
            {challenges.map((challenge) => {
              const winnerId =
                challenge.outcome === "creator"
                  ? challenge.creatorId
                  : challenge.outcome === "opponent"
                    ? challenge.opponentId
                    : null;
              const label =
                challenge.outcome === "push"
                  ? copy.rivalryPage.pushed
                  : winnerId === viewer.id
                    ? copy.rivalryPage.youWon
                    : copy.rivalryPage.theyWon;

              return (
                <li key={challenge.id}>
                  <Link
                    href={`/c/${challenge.slug}`}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3"
                  >
                    <span>
                      <span className="block font-semibold">
                        {challenge.awayAbbr} at {challenge.homeAbbr}
                      </span>
                      <span className="block text-xs text-[var(--muted)]">
                        {challenge.league.toUpperCase()}
                        {challenge.settledAt
                          ? ` · ${formatKickoff(challenge.settledAt)}`
                          : ""}
                      </span>
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        challenge.outcome === "push"
                          ? "text-[var(--muted)]"
                          : winnerId === viewer.id
                            ? "text-[var(--orange-strong)]"
                            : "text-[var(--blue)]"
                      }`}
                    >
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
