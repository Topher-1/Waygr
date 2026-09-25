import { describe, expect, it } from "vitest";
import { APP_TIMEZONE } from "@/lib/constants";
import {
  localDateKeyAt,
  nextLocalDateKey,
  partitionHomeQuickCalls,
} from "@/lib/time/local-slate";

describe("local slate partitioning", () => {
  // Thu Sep 24, 2026 ~7:09 PM America/Chicago (Fri 00:09 UTC)
  const now = new Date("2026-09-25T00:09:00.000Z");

  it("uses America/Chicago as the app display timezone", () => {
    expect(APP_TIMEZONE).toBe("America/Chicago");
    expect(localDateKeyAt(now)).toBe("2026-09-24");
    expect(nextLocalDateKey(now)).toBe("2026-09-25");
  });

  it("keeps Thu evening games under tonight and Fri afternoon under tomorrow", () => {
    const games = [
      { id: "nfl", startsAt: "2026-09-25T00:15:00.000Z" }, // Thu 7:15 PM CT
      { id: "mlb-late", startsAt: "2026-09-25T03:40:00.000Z" }, // Thu 10:40 PM CT
      { id: "chc-bos", startsAt: "2026-09-25T17:05:00.000Z" }, // Fri 12:05 PM CT
      { id: "bal-nyy", startsAt: "2026-09-25T20:05:00.000Z" }, // Fri 3:05 PM CT
    ];

    const { tonight, tomorrow } = partitionHomeQuickCalls(games, now);

    expect(tonight.map((g) => g.id)).toEqual(["nfl", "mlb-late"]);
    expect(tomorrow.map((g) => g.id)).toEqual(["chc-bos", "bal-nyy"]);
  });

  it("drops games beyond tomorrow", () => {
    const games = [
      { id: "today", startsAt: "2026-09-25T00:15:00.000Z" },
      { id: "tomorrow", startsAt: "2026-09-25T17:05:00.000Z" },
      { id: "later", startsAt: "2026-09-27T17:05:00.000Z" },
    ];

    const { tonight, tomorrow } = partitionHomeQuickCalls(games, now);

    expect(tonight).toHaveLength(1);
    expect(tomorrow).toHaveLength(1);
  });
});
