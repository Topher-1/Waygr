import { describe, expect, it } from "vitest";
import { hydrateChallengeRow } from "@/lib/challenges/hydrate";
import { resolveTeamInfo } from "@/lib/teams/catalog";

describe("hydrateChallengeRow", () => {
  it("hydrates without DB teams lookup using catalog colors", () => {
    const row = {
      id: "c1",
      slug: "vBktxJRXe2",
      state: "open",
      market: "moneyline",
      creator_pick: "home",
      line: null,
      quarter: null,
      forfeit_kind: "custom",
      forfeit_text: "A beer + $10",
      outcome: null,
      accepted_at: null,
      settled_at: null,
      creator: {
        id: "user-1",
        handle: "chris",
        display_name: "Chris",
        avatar_url: null,
      },
      opponent: null,
      game: {
        id: "g1",
        league: "nfl",
        starts_at: "2026-09-25T00:15:00.000Z",
        status: "scheduled",
        period: null,
        clock: null,
        home_score: 0,
        away_score: 0,
        period_scores: [],
        updated_at: "2026-09-24T12:00:00.000Z",
        home_team: "nfl:GB",
        away_team: "nfl:ATL",
      },
    };

    const challenge = hydrateChallengeRow(row);
    expect(challenge).not.toBeNull();
    expect(challenge?.slug).toBe("vBktxJRXe2");
    expect(challenge?.game.homeTeam.primaryColor).toBe("#203731");
    expect(challenge?.game.awayTeam.primaryColor).toBe("#A71930");
  });

  it("returns null when game or creator is missing", () => {
    expect(hydrateChallengeRow({ id: "c1", slug: "x", creator: null, game: null })).toBeNull();
  });
});

describe("resolveTeamInfo", () => {
  it("uses distinct official colors for ATL and GB", () => {
    const gb = resolveTeamInfo("nfl:GB");
    const atl = resolveTeamInfo("nfl:ATL");

    expect(gb.primaryColor).toBe("#203731");
    expect(gb.secondaryColor).toBe("#FFB612");
    expect(atl.primaryColor).toBe("#A71930");
    expect(atl.secondaryColor).toBe("#000000");
    expect(gb.primaryColor).not.toBe(atl.primaryColor);
  });

  it("falls back to brand token pairs for unknown teams", () => {
    const unknown = resolveTeamInfo("nfl:ZZZ");
    expect(unknown.primaryColor).toMatch(/^#/);
    expect(unknown.abbr).toBe("ZZZ");
    expect(unknown.name).toBe("ZZZ");
  });

  it("names Panthers and Browns so CAR and CLE are not the display name", () => {
    expect(resolveTeamInfo("nfl:CAR")).toMatchObject({
      abbr: "CAR",
      name: "Panthers",
    });
    expect(resolveTeamInfo("nfl:CLE")).toMatchObject({
      abbr: "CLE",
      name: "Browns",
    });
    expect(resolveTeamInfo("nfl:ARI").name).toBe("Cardinals");
  });
});
