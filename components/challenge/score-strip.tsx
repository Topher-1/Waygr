import type { ChallengeLanding } from "@/lib/challenges/types";

type ScoreStripProps = {
  challenge: ChallengeLanding;
  loading?: boolean;
};

export function ScoreStrip({ challenge, loading }: ScoreStripProps) {
  const { game } = challenge;
  const isLive = game.status === "live";

  if (loading) {
    return (
      <div
        className="h-20 animate-pulse rounded-2xl bg-[var(--raised)]"
        aria-hidden
      />
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-2 flex items-center justify-between text-sm text-[var(--muted)]">
        <span>{game.league.toUpperCase()}</span>
        {isLive ? (
          <span className="font-semibold text-[var(--orange-strong)]">LIVE</span>
        ) : null}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <p className="text-sm text-[var(--muted)]">{game.awayTeam.abbr}</p>
          <p className="font-[family-name:var(--font-barlow)] text-3xl font-bold">
            {game.awayScore}
          </p>
        </div>
        <span className="text-[var(--muted)]">@</span>
        <div>
          <p className="text-sm text-[var(--muted)]">{game.homeTeam.abbr}</p>
          <p className="font-[family-name:var(--font-barlow)] text-3xl font-bold">
            {game.homeScore}
          </p>
        </div>
      </div>
    </div>
  );
}
