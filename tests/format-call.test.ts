import { describe, expect, it } from "vitest";
import {
  formatCallFromParts,
  formatForfeit,
  formatStakeDisplay,
} from "@/lib/challenges/format";
import type { ChallengeLanding } from "@/lib/challenges/types";

const game = {
  homeTeam: { abbr: "GB", name: "Green Bay Packers" },
  awayTeam: { abbr: "ATL", name: "Atlanta Falcons" },
};

describe("formatCallFromParts", () => {
  it("formats winner picks with team abbrs", () => {
    expect(
      formatCallFromParts({
        market: "winner",
        creatorPick: "home",
        line: null,
        quarter: null,
        game,
      }),
    ).toBe("GB wins");
  });

  it("formats spread picks with team abbr and line", () => {
    expect(
      formatCallFromParts({
        market: "spread",
        creatorPick: "home",
        line: -3.5,
        quarter: null,
        game,
      }),
    ).toBe("GB -3.5");
  });

  it("formats total picks", () => {
    expect(
      formatCallFromParts({
        market: "total",
        creatorPick: "over",
        line: 47.5,
        quarter: null,
        game,
      }),
    ).toBe("Over 47.5");
  });

  it("formats quarter winner picks", () => {
    expect(
      formatCallFromParts({
        market: "quarter_winner",
        creatorPick: "away",
        line: null,
        quarter: 2,
        game,
      }),
    ).toBe("ATL win Q2");
  });
});

describe("forfeit display helpers", () => {
  const baseChallenge = {
    forfeitKind: "custom",
    forfeitText: "a beer + $10",
  } as ChallengeLanding;

  it("formatForfeit prefixes composed custom text with owes", () => {
    expect(formatForfeit(baseChallenge)).toBe("owes a beer + $10");
  });

  it("formatStakeDisplay shows composed text without owes", () => {
    expect(formatStakeDisplay(baseChallenge)).toBe("a beer + $10");
  });
});
