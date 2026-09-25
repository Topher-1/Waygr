import { describe, expect, it } from "vitest";
import { formatLiveLabel } from "@/lib/games/live-label";

describe("formatLiveLabel", () => {
  it("returns null when the game is not live", () => {
    expect(
      formatLiveLabel({
        league: "mlb",
        status: "final",
        period: 9,
        clock: "0:00",
        periodScores: [],
      }),
    ).toBeNull();
  });

  it("shows Top inning for MLB without a meaningless clock", () => {
    expect(
      formatLiveLabel({
        league: "mlb",
        status: "live",
        period: 3,
        clock: "0:00",
        periodScores: [
          { period: 1, home: 1, away: 0 },
          { period: 2, home: 0, away: 1 },
        ],
      }),
    ).toBe("Top 3");
  });

  it("shows Bot inning when the current inning row exists", () => {
    expect(
      formatLiveLabel({
        league: "mlb",
        status: "live",
        period: 7,
        clock: null,
        periodScores: [
          { period: 1, home: 0, away: 1 },
          { period: 2, home: 2, away: 0 },
          { period: 3, home: 0, away: 0 },
          { period: 4, home: 1, away: 0 },
          { period: 5, home: 0, away: 2 },
          { period: 6, home: 1, away: 0 },
          { period: 7, home: 0, away: 0 },
        ],
      }),
    ).toBe("Bot 7");
  });

  it("never shows Q-prefixed labels for MLB", () => {
    const label = formatLiveLabel({
      league: "mlb",
      status: "live",
      period: 5,
      clock: "0:00",
      periodScores: [{ period: 1, home: 0, away: 0 }],
    });
    expect(label).not.toMatch(/^Q\d/);
    expect(label).toBe("Top 5");
  });

  it("keeps quarter and clock for NFL", () => {
    expect(
      formatLiveLabel({
        league: "nfl",
        status: "live",
        period: 2,
        clock: "5:42",
        periodScores: [
          { period: 1, home: 7, away: 3 },
          { period: 2, home: 7, away: 7 },
        ],
      }),
    ).toBe("Q2 5:42");
  });

  it("keeps quarter and clock for NCAAF", () => {
    expect(
      formatLiveLabel({
        league: "ncaaf",
        status: "live",
        period: 4,
        clock: "0:12",
        periodScores: [],
      }),
    ).toBe("Q4 0:12");
  });

  it("keeps quarter and clock for NBA", () => {
    expect(
      formatLiveLabel({
        league: "nba",
        status: "live",
        period: 3,
        clock: "8:04",
        periodScores: [],
      }),
    ).toBe("Q3 8:04");
  });

  it("falls back to LIVE when MLB has no inning or clock", () => {
    expect(
      formatLiveLabel({
        league: "mlb",
        status: "live",
        period: null,
        clock: null,
        periodScores: [],
      }),
    ).toBe("LIVE");
  });
});
