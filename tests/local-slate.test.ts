import { describe, expect, it } from "vitest";
import { APP_TIMEZONE } from "@/lib/constants";
import {
  excludePriorLocalDays,
  formatLocalDayHeading,
  groupGamesByLocalDay,
  localDateKeyAt,
  nextLocalDateKey,
  partitionHomeQuickCalls,
  startOfLocalDay,
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

describe("create picker local slate", () => {
  // Fri Sep 25, 2026 ~1:22 PM America/Chicago
  const fridayAfternoon = new Date("2026-09-25T18:22:00.000Z");

  it("anchors the picker window at local midnight", () => {
    expect(startOfLocalDay(fridayAfternoon).toISOString()).toBe(
      "2026-09-25T05:00:00.000Z",
    );
    expect(localDateKeyAt(fridayAfternoon)).toBe("2026-09-25");
  });

  it("excludes Thursday games and keeps the full Friday slate", () => {
    const games = [
      { id: "thu-chw-kc", startsAt: "2026-09-24T18:10:00.000Z" },
      { id: "thu-laa-sea", startsAt: "2026-09-25T03:10:00.000Z" },
      { id: "fri-chc-bos-early", startsAt: "2026-09-25T17:05:00.000Z" },
      { id: "fri-bal-nyy", startsAt: "2026-09-25T20:05:00.000Z" },
      { id: "fri-col-cws-late", startsAt: "2026-09-25T23:40:00.000Z" },
    ];

    const filtered = excludePriorLocalDays(games, fridayAfternoon);

    expect(filtered.map((g) => g.id)).toEqual([
      "fri-chc-bos-early",
      "fri-bal-nyy",
      "fri-col-cws-late",
    ]);
  });

  it("groups picker headings in America/Chicago", () => {
    const games = [
      { id: "fri-1", startsAt: "2026-09-25T17:05:00.000Z" },
      { id: "fri-2", startsAt: "2026-09-25T23:40:00.000Z" },
      { id: "sat-1", startsAt: "2026-09-26T17:05:00.000Z" },
    ];

    const grouped = groupGamesByLocalDay(games);
    const headings = [...grouped.keys()];

    expect(headings).toEqual(["Friday, Sep 25", "Saturday, Sep 26"]);
    expect(grouped.get("Friday, Sep 25")?.map((g) => g.id)).toEqual([
      "fri-1",
      "fri-2",
    ]);
    expect(formatLocalDayHeading(fridayAfternoon)).toBe("Friday, Sep 25");
  });

  it("keeps a full Friday list that would previously be crowded out by Thursday", () => {
    const thursdayStarts = [
      "2026-09-24T18:10:00.000Z",
      "2026-09-24T18:20:00.000Z",
      "2026-09-24T18:35:00.000Z",
      "2026-09-24T19:10:00.000Z",
      "2026-09-24T22:05:00.000Z",
      "2026-09-24T22:45:00.000Z",
      "2026-09-24T23:05:00.000Z",
      "2026-09-24T23:15:00.000Z",
      "2026-09-25T03:10:00.000Z",
    ];
    const thursdaySlate = thursdayStarts.map((startsAt, index) => ({
      id: `thu-${index}`,
      startsAt,
    }));
    const fridaySlate = [
      { id: "fri-chc-bos", startsAt: "2026-09-25T17:05:00.000Z" },
      { id: "fri-col-cws", startsAt: "2026-09-25T23:40:00.000Z" },
    ];

    const filtered = excludePriorLocalDays(
      [...thursdaySlate, ...fridaySlate],
      fridayAfternoon,
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.map((g) => g.id)).toEqual(["fri-chc-bos", "fri-col-cws"]);
  });
});
