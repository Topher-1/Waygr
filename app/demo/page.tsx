import Link from "next/link";
import { ChallengeClient } from "@/components/challenge/challenge-client";
import {
  demoChallenges,
  demoViewOrder,
} from "@/lib/challenges/demo-fixture";
import type { ChallengeView } from "@/lib/challenges/types";
import { copy } from "@/lib/copy";

type PageProps = {
  searchParams: Promise<{ view?: string }>;
};

const viewLabels: Record<ChallengeView, string> = {
  open: "Open",
  taken: "Taken",
  live: "Live",
  settled: "Settled",
  void: "Void",
};

export default async function DemoPage({ searchParams }: PageProps) {
  const { view: viewParam } = await searchParams;
  const view: ChallengeView = demoViewOrder.includes(viewParam as ChallengeView)
    ? (viewParam as ChallengeView)
    : "open";

  const challenge = demoChallenges[view];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav
        className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3"
        aria-label="Demo views"
      >
        {demoViewOrder.map((v) => (
          <Link
            key={v}
            href={`/demo?view=${v}`}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
              v === view
                ? "bg-[var(--orange)] text-[var(--on-accent)]"
                : "bg-[var(--raised)] text-[var(--muted)]"
            }`}
          >
            {viewLabels[v]}
          </Link>
        ))}
      </nav>
      <p className="px-5 py-2 text-center text-xs text-[var(--muted)]">
        {copy.auth.demoNote}
      </p>
      <ChallengeClient
        challenge={challenge}
        view={view}
        viewer={null}
        demoMode
      />
    </div>
  );
}
