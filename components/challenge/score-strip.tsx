import type { ChallengeLandingGame } from "@/lib/challenges/types";
import { copy } from "@/lib/copy";
import { formatLiveLabel } from "@/lib/games/live-label";

type ScoreStripProps = {
  game: ChallengeLandingGame;
  stale?: boolean;
  loading?: boolean;
};

function hasVisibleScores(game: ChallengeLandingGame): boolean {
  return (
    game.homeScore > 0 ||
    game.awayScore > 0 ||
    game.periodScores.length > 0
  );
}

export function ScoreStrip({ game, stale = false, loading = false }: ScoreStripProps) {
  const isLive = game.status === "live";
  const showSkeleton = loading || (stale && isLive && !hasVisibleScores(game));
  const showLagging = stale && isLive && !loading;

  if (showSkeleton) {
    return (
      <div className="space-y-2">
        <div
          className="h-24 animate-pulse rounded-2xl bg-[var(--raised)]"
          aria-hidden
        />
        {showLagging ? (
          <p className="text-center text-sm text-[var(--muted)]">
            {copy.live.lagging}
          </p>
        ) : null}
      </div>
    );
  }

  const midLabel = formatLiveLabel(game);

  return (
    <div className="space-y-2">
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-2 flex items-center justify-between text-sm text-[var(--muted)]">
        <span>{game.league.toUpperCase()}</span>
        {isLive ? (
          <span className="font-semibold text-[var(--orange-strong)]">
            <span className="mr-1 inline-block animate-pulse">●</span>
            LIVE{midLabel ? ` · ${midLabel}` : ""}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div className="text-right">
          <p className="text-sm text-[var(--muted)]">{game.awayTeam.abbr}</p>
          <p className="font-[family-name:var(--font-barlow)] text-3xl font-bold tabular-nums">
            {game.awayScore}
          </p>
        </div>
        <div className="pb-1 text-center text-sm text-[var(--muted)] tabular-nums">
          {midLabel && !isLive ? midLabel : "@"}
        </div>
        <div>
          <p className="text-sm text-[var(--muted)]">{game.homeTeam.abbr}</p>
          <p className="font-[family-name:var(--font-barlow)] text-3xl font-bold tabular-nums">
            {game.homeScore}
          </p>
        </div>
      </div>
    </div>
    {showLagging ? (
      <p className="text-center text-sm text-[var(--muted)]">
        {copy.live.lagging}
      </p>
    ) : null}
    </div>
  );
}
