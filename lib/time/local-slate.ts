import { APP_TIMEZONE } from "@/lib/constants";

const dateKeyFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/** Calendar date (YYYY-MM-DD) for an instant in the app display timezone. */
export function localDateKeyAt(instant: Date, timeZone = APP_TIMEZONE): string {
  return dateKeyFormatter(timeZone).format(instant);
}

/** Next calendar date after `now` in the app display timezone. */
export function nextLocalDateKey(now: Date, timeZone = APP_TIMEZONE): string {
  const today = localDateKeyAt(now, timeZone);
  for (let hours = 1; hours <= 30; hours += 1) {
    const key = localDateKeyAt(new Date(now.getTime() + hours * 3600_000), timeZone);
    if (key !== today) return key;
  }
  throw new Error(`Could not resolve next local date in ${timeZone}`);
}

/** Split upcoming games into tonight (local today) and tomorrow (local next day). */
export function partitionHomeQuickCalls<T extends { startsAt: string }>(
  games: T[],
  now: Date,
  timeZone = APP_TIMEZONE,
): { tonight: T[]; tomorrow: T[] } {
  const todayKey = localDateKeyAt(now, timeZone);
  const tomorrowKey = nextLocalDateKey(now, timeZone);
  const tonight: T[] = [];
  const tomorrow: T[] = [];

  for (const game of games) {
    const key = localDateKeyAt(new Date(game.startsAt), timeZone);
    if (key === todayKey) {
      tonight.push(game);
    } else if (key === tomorrowKey) {
      tomorrow.push(game);
    }
  }

  return { tonight, tomorrow };
}
