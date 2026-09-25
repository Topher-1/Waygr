import { describe, expect, it } from "vitest";
import type { ChallengeLanding } from "@/lib/challenges/types";
import { clampOgText, formatOgMatchup } from "@/lib/challenges/format";

function challenge(
  away: { abbr: string; name: string },
  home: { abbr: string; name: string },
): ChallengeLanding {
  const team = (side: { abbr: string; name: string }) => ({
    code: `nfl:${side.abbr}`,
    abbr: side.abbr,
    name: side.name,
    primaryColor: "#000000",
    secondaryColor: "#000000",
  });
  return {
    id: "1",
    slug: "s",
    state: "open",
    market: "winner",
    creatorPick: "home",
    line: null,
    quarter: null,
    forfeitKind: "custom",
    forfeitText: "a beer",
    outcome: null,
    acceptedAt: null,
    settledAt: null,
    creator: {
      id: "c",
      handle: "sam",
      displayName: "Sam",
      avatarUrl: null,
    },
    opponent: null,
    game: {
      id: "g",
      league: "nfl",
      startsAt: "2026-09-27T17:00:00.000Z",
      status: "scheduled",
      period: null,
      clock: null,
      homeScore: 0,
      awayScore: 0,
      periodScores: [],
      updatedAt: "2026-09-27T17:00:00.000Z",
      awayTeam: team(away),
      homeTeam: team(home),
    },
  };
}

describe("formatOgMatchup", () => {
  it("uses nicknames so CAR at CLE does not read as a chopped header", () => {
    expect(
      formatOgMatchup(
        challenge({ abbr: "CAR", name: "Panthers" }, { abbr: "CLE", name: "Browns" }),
      ),
    ).toBe("PANTHERS @ BROWNS");
  });

  it("keeps a code when that is the only name we have", () => {
    expect(
      formatOgMatchup(
        challenge({ abbr: "CHW", name: "CHW" }, { abbr: "CLE", name: "Browns" }),
      ),
    ).toBe("CHW @ BROWNS");
  });

  it("falls back to abbreviations when nicknames would overflow the card", () => {
    const long = "North Carolina State Wolfpack";
    expect(
      formatOgMatchup(
        challenge({ abbr: "NCST", name: long }, { abbr: "OSU", name: "Ohio State Buckeyes" }),
      ),
    ).toBe("NCST @ OSU");
  });

  it("ellipsizes both sides when even the codes are too long", () => {
    const line = formatOgMatchup(
      challenge(
        { abbr: "AVERYLONGABBRCODE", name: "AVERYLONGABBRCODE" },
        { abbr: "ANOTHERLONGABBRCODE", name: "ANOTHERLONGABBRCODE" },
      ),
    );
    expect(line.length).toBeLessThanOrEqual(32);
    expect(line).toContain(" @ ");
    expect(line.endsWith("…") || line.includes("…")).toBe(true);
  });
});

describe("clampOgText", () => {
  it("leaves a stake that fits the card alone", () => {
    const stake = "Loser owes a beer + garlic bread. You in?";
    expect(clampOgText(stake, 120)).toBe(stake);
  });

  it("ends a novel-length stake on an ellipsis", () => {
    const stake = "Loser owes " + "garlic bread and ".repeat(20);
    const clamped = clampOgText(stake, 120);
    expect(clamped.length).toBeLessThanOrEqual(120);
    expect(clamped.endsWith("…")).toBe(true);
  });
});
