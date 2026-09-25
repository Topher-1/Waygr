import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { copy } from "@/lib/copy";
import { APP_NAME } from "@/lib/constants";
import { getProfilePage } from "@/lib/profiles/queries";
import { getViewerProfile } from "@/lib/auth/profile";
import { formatSettledWaygrLine } from "@/lib/challenges/settled-history";
import { formatPaidRate } from "@/lib/profiles/stats";
import { JerseyAvatar } from "@/components/profile/jersey-avatar";

type PageProps = { params: Promise<{ handle: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle} · ${APP_NAME}` };
}

export default async function ProfilePage({ params }: PageProps) {
  const { handle } = await params;

  let page;
  try {
    page = await getProfilePage(handle);
  } catch {
    notFound();
  }

  if (!page) {
    notFound();
  }

  const viewer = await getViewerProfile();
  const isSelf = viewer?.id === page.profile.id;
  const { profile, stats, rivalries, settledWaygrs } = page;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-5 py-8">
      <header className="space-y-4">
        <JerseyAvatar
          displayName={profile.displayName}
          avatarUrl={profile.avatarUrl}
          jerseyTeam={profile.jerseyTeam}
          jerseyUntil={profile.jerseyUntil}
        />
        <div>
          <h1 className="font-[family-name:var(--font-barlow)] text-3xl font-extrabold">
            {profile.displayName}
          </h1>
          <p className="text-sm text-[var(--muted)]">@{profile.handle}</p>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
            {copy.profile.record}
          </dt>
          <dd className="mt-1 font-[family-name:var(--font-barlow)] text-2xl font-extrabold">
            {copy.profile.recordValue(stats.wins, stats.losses, stats.pushes)}
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
            {copy.profile.paidRate}
          </dt>
          <dd className="mt-1 font-[family-name:var(--font-barlow)] text-2xl font-extrabold">
            {formatPaidRate(stats.forfeitPaidRate)}
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">
            {copy.home.owed}
          </dt>
          <dd
            className={`mt-1 font-[family-name:var(--font-barlow)] text-2xl font-extrabold ${
              stats.owes > 0 ? "text-[var(--orange-strong)]" : ""
            }`}
          >
            {stats.owes > 0 ? copy.profile.owes(stats.owes) : copy.profile.owesNone}
          </dd>
        </div>
      </dl>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          {copy.profile.settledHistory}
        </h2>
        {settledWaygrs.length === 0 ? (
          <p className="text-[var(--muted)]">{copy.profile.noSettledHistory}</p>
        ) : (
          <ul className="space-y-2">
            {settledWaygrs.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/c/${item.slug}`}
                  className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"
                >
                  {formatSettledWaygrLine(item)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          {copy.profile.topRivalries}
        </h2>
        {rivalries.length === 0 ? (
          <p className="text-[var(--muted)]">{copy.profile.noRivalries}</p>
        ) : (
          <ul className="space-y-2">
            {rivalries.map((rivalry) => (
              <li key={rivalry.profileId}>
                <Link
                  href={isSelf ? `/r/${rivalry.handle}` : `/u/${rivalry.handle}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3"
                >
                  <span className="font-semibold">{rivalry.displayName}</span>
                  <span className="text-sm text-[var(--muted)]">
                    {copy.profile.recordValue(
                      rivalry.wins,
                      rivalry.losses,
                      rivalry.pushes,
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isSelf && viewer ? (
        <Link
          href={`/r/${profile.handle}`}
          className="text-sm font-semibold text-[var(--orange-strong)] underline-offset-2 hover:underline"
        >
          {copy.profile.viewRivalry}
        </Link>
      ) : null}

      <Link
        href="/"
        className="text-sm text-[var(--muted)] underline-offset-2 hover:underline"
      >
        {copy.appName}
      </Link>
    </main>
  );
}
