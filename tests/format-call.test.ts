import { describe, expect, it } from "vitest";
import type { Market } from "@/lib/challenges/create";
import {
  formatCallFromParts,
  formatForfeit,
  formatStakeDisplay,
} from "@/lib/challenges/format";
import type { ChallengeLanding } from "@/lib/challenges/types";

/** Markets offered in the create flow — keep tests aligned with create-sheet. */
const CREATE_MARKETS: Market[] = [
  "spread",
  "winner",
  "total",
  "half_leader",
  "quarter_winner",
];

const game = {
  homeTeam: { abbr: "GB", name: "Green Bay Packers" },
  awayTeam: { abbr: "ATL", name: "Atlanta Falcons" },
};

describe("formatCallFromParts — create flow markets", () => {
  it("covers every market the create sheet offers", () => {
    expect(CREATE_MARKETS).toEqual([
      "spread",
      "winner",
      "total",
      "half_leader",
      "quarter_winner",
    ]);
  });

  it("formats winner with team abbr, never home/away", () => {
    expect(
      formatCallFromParts({
        market: "winner",
        creatorPick: "home",
        line: null,
        quarter: null,
        game,
      }),
    ).toBe("GB wins");
    expect(
      formatCallFromParts({
        market: "winner",
        creatorPick: "away",
        line: null,
        quarter: null,
        game,
      }),
    ).toBe("ATL wins");
  });

  it("formats spread with picked team abbr and signed line", () => {
    expect(
      formatCallFromParts({
        market: "spread",
        creatorPick: "home",
        line: -3.5,
        quarter: null,
        game,
      }),
    ).toBe("GB -3.5");
    expect(
      formatCallFromParts({
        market: "spread",
        creatorPick: "away",
        line: 3.5,
        quarter: null,
        game,
      }),
    ).toBe("ATL +3.5");
  });

  it("formats total as Over/Under with line", () => {
    expect(
      formatCallFromParts({
        market: "total",
        creatorPick: "over",
        line: 47.5,
        quarter: null,
        game,
      }),
    ).toBe("Over 47.5");
    expect(
      formatCallFromParts({
        market: "total",
        creatorPick: "under",
        line: 47.5,
        quarter: null,
        game,
      }),
    ).toBe("Under 47.5");
  });

  it("formats half_leader with team abbr", () => {
    expect(
      formatCallFromParts({
        market: "half_leader",
        creatorPick: "home",
        line: null,
        quarter: null,
        game,
      }),
    ).toBe("GB leads at half");
    expect(
      formatCallFromParts({
        market: "half_leader",
        creatorPick: "away",
        line: null,
        quarter: null,
        game,
      }),
    ).toBe("ATL leads at half");
  });

  it("formats quarter_winner with team abbr and quarter", () => {
    expect(
      formatCallFromParts({
        market: "quarter_winner",
        creatorPick: "home",
        line: null,
        quarter: 1,
        game,
      }),
    ).toBe("GB wins Q1");
    expect(
      formatCallFromParts({
        market: "quarter_winner",
        creatorPick: "away",
        line: null,
        quarter: 2,
        game,
      }),
    ).toBe("ATL wins Q2");
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
