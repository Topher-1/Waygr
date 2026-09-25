import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAMES_WINDOW_DAYS,
  MAX_GAMES_WINDOW_DAYS,
  parseGamesQuery,
} from "@/lib/games/query-bounds";
import { startOfLocalDay } from "@/lib/time/local-slate";

describe("parseGamesQuery", () => {
  const now = new Date("2026-09-20T12:00:00Z");

  it("defaults from to start of local day and to next 7 days", () => {
    const result = parseGamesQuery(new URLSearchParams(), now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.params.from.toISOString()).toBe(
      startOfLocalDay(now).toISOString(),
    );
    const expectedTo = new Date(
      startOfLocalDay(now).getTime() +
        DEFAULT_GAMES_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(result.params.to.toISOString()).toBe(expectedTo.toISOString());
    expect(result.params.league).toBeNull();
  });

  it("rejects invalid league", () => {
    const result = parseGamesQuery(new URLSearchParams("league=epl"), now);
    expect(result).toEqual({ ok: false, reason: "invalid_league" });
  });

  it("accepts mlb league", () => {
    const result = parseGamesQuery(new URLSearchParams("league=mlb"), now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.params.league).toBe("mlb");
  });

  it("clamps range to max 7 days from from", () => {
    const from = "2026-09-20T00:00:00Z";
    const to = "2026-10-15T00:00:00Z";
    const result = parseGamesQuery(
      new URLSearchParams(`from=${from}&to=${to}`),
      now,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const maxTo = new Date(
      result.params.from.getTime() + MAX_GAMES_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(result.params.to.toISOString()).toBe(maxTo.toISOString());
  });

  it("rejects inverted range", () => {
    const result = parseGamesQuery(
      new URLSearchParams(
        "from=2026-09-25T00:00:00Z&to=2026-09-20T00:00:00Z",
      ),
      now,
    );
    expect(result).toEqual({ ok: false, reason: "invalid_range" });
  });
});
