import { describe, expect, it } from "vitest";
import { PHASE1_LEAGUES } from "@/lib/games/sync";

describe("games sync PoC leagues", () => {
  it("syncs free BDL nfl, nba, and mlb by default", () => {
    expect(PHASE1_LEAGUES).toEqual(["nfl", "nba", "mlb"]);
  });
});
