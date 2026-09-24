import { describe, expect, it } from "vitest";
import { resolveChallengeView } from "@/lib/challenges/views";
import type { ChallengeLanding } from "@/lib/challenges/types";

function makeChallenge(
  overrides: Partial<ChallengeLanding> & { state: string },
): ChallengeLanding {
  const future = new Date(Date.now() + 3600_000).toISOString();
  return {
    id: "c1",
    slug: "abc123",
    market: "spread",
    creatorPick: "home",
    line: "-3.5",
    quarter: null,
    forfeitKind: "jersey_swap",
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
    opponent: null,
    game: {
      id: "g1",
      league: "nfl",
      startsAt: future,
      status: "scheduled",
      period: null,
      clock: null,
      homeScore: 0,
      awayScore: 0,
      homeTeam: {
        code: "nfl:KC",
        abbr: "KC",
        name: "Chiefs",
        primaryColor: "#E31837",
        secondaryColor: "#FFB612",
      },
      awayTeam: {
        code: "nfl:BUF",
        abbr: "BUF",
        name: "Bills",
        primaryColor: "#00338D",
        secondaryColor: "#C60C30",
      },
    },
    ...overrides,
  };
}

describe("resolveChallengeView", () => {
  it("shows open for unsigned visitor on open challenge", () => {
    const view = resolveChallengeView(makeChallenge({ state: "open" }), null);
    expect(view).toBe("open");
  });

  it("shows taken when opponent exists and visitor is not participant", () => {
    const view = resolveChallengeView(
      makeChallenge({
        state: "accepted",
        opponent: {
          id: "opp",
          handle: "jordan",
          displayName: "Jordan",
          avatarUrl: null,
        },
      }),
      null,
    );
    expect(view).toBe("taken");
  });

  it("shows live for participant on accepted challenge", () => {
    const view = resolveChallengeView(
      makeChallenge({
        state: "accepted",
        opponent: {
          id: "opp",
          handle: "jordan",
          displayName: "Jordan",
          avatarUrl: null,
        },
      }),
      "opp",
    );
    expect(view).toBe("live");
  });

  it("shows settled for settled challenges", () => {
    const view = resolveChallengeView(
      makeChallenge({ state: "settled", outcome: "creator" }),
      null,
    );
    expect(view).toBe("settled");
  });

  it("shows void for expired open past kickoff", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const view = resolveChallengeView(
      makeChallenge({
        state: "open",
        game: {
          ...makeChallenge({ state: "open" }).game,
          startsAt: past,
        },
      }),
      null,
    );
    expect(view).toBe("void");
  });
});
