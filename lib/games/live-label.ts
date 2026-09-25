import type { League } from "@/lib/scores/types";

export type LiveLabelInput = {
  league: string;
  status: string;
  period: number | null;
  clock: string | null;
  periodScores?: { period: number; home: number; away: number }[];
};

const QUARTER_LEAGUES = new Set<League>(["nfl", "ncaaf", "nba", "ncaab"]);

function isMeaninglessMlbClock(clock: string | null): boolean {
  if (!clock) return true;
  const normalized = clock.trim();
  return normalized === "" || normalized === "0:00" || normalized === "0:00:00";
}

/** Top/Bot from completed inning rows; current inning absent until both sides have a line. */
function formatMlbInningLabel(
  period: number,
  periodScores: LiveLabelInput["periodScores"],
): string {
  const scores = periodScores ?? [];
  const inBottom = scores.some((row) => row.period === period);
  return inBottom ? `Bot ${period}` : `Top ${period}`;
}

function formatQuarterLabel(period: number, clock: string | null): string {
  const quarter = `Q${period}`;
  if (clock) {
    return `${quarter} ${clock}`;
  }
  return quarter;
}

/** Live score strip label — league-aware period/clock (innings for MLB). */
export function formatLiveLabel(input: LiveLabelInput): string | null {
  if (input.status !== "live") {
    return null;
  }

  if (input.league === "mlb") {
    const inning =
      input.period != null
        ? formatMlbInningLabel(input.period, input.periodScores)
        : null;
    const clock = isMeaninglessMlbClock(input.clock) ? null : input.clock;
    if (inning && clock) {
      return `${inning} ${clock}`;
    }
    return inning ?? clock ?? "LIVE";
  }

  if (input.period != null && QUARTER_LEAGUES.has(input.league as League)) {
    return formatQuarterLabel(input.period, input.clock);
  }

  const period = input.period ? `Q${input.period}` : null;
  const clock = input.clock ?? null;
  if (period && clock) {
    return `${period} ${clock}`;
  }
  return period ?? clock ?? "LIVE";
}
