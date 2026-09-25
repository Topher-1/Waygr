import { APP_TIMEZONE } from "@/lib/constants";

const dateKeyFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const dayHeadingFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "short",
    day: "numeric",
  });

/** Calendar date (YYYY-MM-DD) for an instant in the app display timezone. */
export function localDateKeyAt(instant: Date, timeZone = APP_TIMEZONE): string {
  return dateKeyFormatter(timeZone).format(instant);
}

/** Local midnight for the calendar day containing `instant`. */
export function startOfLocalDay(instant: Date, timeZone = APP_TIMEZONE): Date {
  const key = localDateKeyAt(instant, timeZone);
  const [year, month, day] = key.split("-").map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const offsetMs = getTimeZoneOffsetMs(new Date(utcMidnight), timeZone);
  return new Date(utcMidnight - offsetMs);
}

function getTimeZoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - at.getTime();
}

/** Section heading for a game slate day, e.g. "Friday, Sep 25". */
export function formatLocalDayHeading(instant: Date, timeZone = APP_TIMEZONE): string {
  return dayHeadingFormatter(timeZone).format(instant);
}

/** Group games by local calendar day for the create picker. */
export function groupGamesByLocalDay<T extends { startsAt: string }>(
  games: T[],
  timeZone = APP_TIMEZONE,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const game of games) {
    const heading = formatLocalDayHeading(new Date(game.startsAt), timeZone);
    const list = groups.get(heading) ?? [];
    list.push(game);
    groups.set(heading, list);
  }
  return groups;
}

/** Drop games before today in the app timezone (yesterday's slate). */
export function excludePriorLocalDays<T extends { startsAt: string }>(
  games: T[],
  now: Date,
  timeZone = APP_TIMEZONE,
): T[] {
  const todayKey = localDateKeyAt(now, timeZone);
  return games.filter(
    (game) => localDateKeyAt(new Date(game.startsAt), timeZone) >= todayKey,
  );
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
