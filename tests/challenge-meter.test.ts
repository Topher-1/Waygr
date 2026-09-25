import { describe, expect, it } from "vitest";
import {
  computeCallMargin,
  computeChallengeMeter,
  isScoreFeedStale,
} from "@/lib/challenges/meter";
import type { ChallengeLanding } from "@/lib/challenges/types";

const baseChallenge: ChallengeLanding = {
  id: "c1",
  slug: "abc",
  state: "live",
  market: "spread",
  creatorPick: "home",
  line: "-3.5",
  quarter: null,
  forfeitKind: "concession",
  forfeitText: null,
  outcome: null,
  acceptedAt: null,
  settledAt: null,
  creator: {
    id: "creator",
    handle: "sam",
    displayName: "Sam",
    avatarUrl: null,
  },
  opponent: {
    id: "opponent",
    handle: "jordan",
    displayName: "Jordan",
    avatarUrl: null,
  },
  game: {
    id: "g1",
    league: "nfl",
    startsAt: new Date().toISOString(),
    status: "live",
    period: 2,
    clock: "5:42",
    homeScore: 14,
    awayScore: 10,
    periodScores: [],
    updatedAt: new Date().toISOString(),
    homeTeam: {
      code: "nfl:KC",
      abbr: "KC",
      name: "Chiefs",
      primaryColor: "#ff5f1f",
      secondaryColor: "#0b0b0d",
    },
    awayTeam: {
      code: "nfl:BUF",
      abbr: "BUF",
      name: "Bills",
      primaryColor: "#4d8dff",
      secondaryColor: "#0b0b0d",
    },
  },
};

describe("computeCallMargin", () => {
  it("scores spread from creator team with line", () => {
    expect(computeCallMargin(baseChallenge, baseChallenge.game)).toBe(0.5);
  });

  it("scores total over relative to line", () => {
    const challenge = {
      ...baseChallenge,
      market: "total",
      creatorPick: "over",
      line: "47.5",
    };
    expect(
      computeCallMargin(challenge, {
        ...baseChallenge.game,
        homeScore: 24,
        awayScore: 20,
      }),
    ).toBe(-3.5);
  });

  it("uses quarter scores for quarter_winner", () => {
    const challenge = {
      ...baseChallenge,
      market: "quarter_winner",
      creatorPick: "away",
      line: null,
      quarter: 1,
    };
    expect(
      computeCallMargin(challenge, {
        ...baseChallenge.game,
        periodScores: [{ period: 1, home: 7, away: 10 }],
      }),
    ).toBe(3);
  });
});

describe("computeChallengeMeter", () => {
  it("gives creator a majority share when covering", () => {
    const meter = computeChallengeMeter(
      baseChallenge,
      baseChallenge.game,
      "creator",
    );
    expect(meter.ahead).toBe("viewer");
    expect(meter.viewerShare).toBeGreaterThan(50);
  });

  it("flips share for the opponent viewer", () => {
    const meter = computeChallengeMeter(
      baseChallenge,
      baseChallenge.game,
      "opponent",
    );
    expect(meter.ahead).toBe("opponent");
    expect(meter.viewerShare).toBeLessThan(50);
  });
});

describe("isScoreFeedStale", () => {
  it("flags live games older than two minutes", () => {
    const staleGame = {
      ...baseChallenge.game,
      status: "live",
      updatedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    };
    expect(isScoreFeedStale(staleGame)).toBe(true);
  });

  it("ignores scheduled games", () => {
    expect(
      isScoreFeedStale({
        ...baseChallenge.game,
        status: "scheduled",
        updatedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
      }),
    ).toBe(false);
  });

  it("does not flag live games updated within two minutes", () => {
    expect(
      isScoreFeedStale({
        ...baseChallenge.game,
        status: "live",
        updatedAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    ).toBe(false);
  });
});
