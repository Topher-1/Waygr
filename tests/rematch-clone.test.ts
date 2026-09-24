import { describe, expect, it } from "vitest";
import {
  buildRematchPrefill,
  findNextGameForRematch,
  type RematchSource,
} from "@/lib/challenges/rematch";

describe("rematch clone", () => {
  const source: RematchSource = {
    id: "challenge-1",
    market: "spread",
    creatorPick: "home",
    line: -3.5,
    quarter: null,
    forfeitKind: "jersey_swap",
    forfeitText: null,
    game: {
      homeTeam: "nfl:KC",
      awayTeam: "nfl:BUF",
      startsAt: "2026-09-20T20:00:00Z",
    },
  };

  const candidates = [
    {
      id: "game-old",
      homeTeam: "nfl:KC",
      awayTeam: "nfl:DAL",
      startsAt: "2026-09-19T20:00:00Z",
      status: "scheduled",
    },
    {
      id: "game-next",
      homeTeam: "nfl:KC",
      awayTeam: "nfl:PHI",
      startsAt: "2026-09-27T20:00:00Z",
      status: "scheduled",
    },
  ];

  it("finds next game for either team", () => {
    const now = new Date("2026-09-21T12:00:00Z");
    const next = findNextGameForRematch(source, candidates, now);
    expect(next?.id).toBe("game-next");
  });

  it("clones market, pick, line, and forfeit onto next game", () => {
    const prefill = buildRematchPrefill(source, candidates[1]);
    expect(prefill).toEqual({
      gameId: "game-next",
      market: "spread",
      creatorPick: "home",
      line: -3.5,
      quarter: null,
      forfeitKind: "jersey_swap",
      forfeitText: null,
      rematchOf: "challenge-1",
    });
  });
});
