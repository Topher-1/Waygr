import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveChallengeView } from "@/lib/challenges/views";
import type { ChallengeLanding } from "@/lib/challenges/types";

function makeOpenChallenge(creatorId: string): ChallengeLanding {
  const future = new Date(Date.now() + 3600_000).toISOString();
  return {
    id: "c1",
    slug: "abc123",
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
      id: creatorId,
      handle: "totallykewl4u",
      displayName: "totallykewl4u",
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
      periodScores: [],
      updatedAt: future,
      homeTeam: {
        code: "nfl:GB",
        abbr: "GB",
        name: "Packers",
        primaryColor: "#203731",
        secondaryColor: "#FFB612",
      },
      awayTeam: {
        code: "nfl:ATL",
        abbr: "ATL",
        name: "Falcons",
        primaryColor: "#A71930",
        secondaryColor: "#000000",
      },
    },
  };
}

describe("creator waiting escape hatch", () => {
  const homeSource = readFileSync(
    join(process.cwd(), "components/home/home-client.tsx"),
    "utf8",
  );
  const clientSource = readFileSync(
    join(process.cwd(), "components/challenge/challenge-client.tsx"),
    "utf8",
  );

  it("resolves creator on own open waygr to waiting view", () => {
    const creatorId = "user-chris";
    expect(resolveChallengeView(makeOpenChallenge(creatorId), creatorId)).toBe(
      "waiting",
    );
  });

  it("keeps opponent accept view for friends opening the share link", () => {
    const creatorId = "user-chris";
    expect(resolveChallengeView(makeOpenChallenge(creatorId), "friend-1")).toBe(
      "open",
    );
  });

  it("home waiting cards still link to the share slug route", () => {
    expect(homeSource).toMatch(/feed\.openWaiting\.map/);
    expect(homeSource).toMatch(/href=\{`\/c\/\$\{challenge\.slug\}`\}/);
  });

  it("share slug page renders waiting UI for creator, not accept CTAs", () => {
    expect(clientSource).toMatch(/view === "waiting"/);
    expect(clientSource).toMatch(/CancelCallSheet/);
    const waitingFooter = clientSource.match(
      /view === "waiting" \? \([\s\S]*?\) : view === "open"/,
    )?.[0];
    expect(waitingFooter).toBeDefined();
    expect(waitingFooter).not.toMatch(/copy\.challenge\.accept/);
  });
});
