import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildCreateGamesOrFilter,
  isGameInCreateList,
} from "@/lib/games/create-list";

describe("create game list filter", () => {
  const from = new Date("2026-09-24T20:00:00Z");
  const to = new Date("2026-09-25T06:00:00Z");

  it("includes live games that started before the window", () => {
    expect(
      isGameInCreateList(
        { status: "live", startsAt: new Date("2026-09-24T19:00:00Z") },
        from,
        to,
      ),
    ).toBe(true);
  });

  it("includes scheduled games inside the window", () => {
    expect(
      isGameInCreateList(
        { status: "scheduled", startsAt: new Date("2026-09-24T22:00:00Z") },
        from,
        to,
      ),
    ).toBe(true);
  });

  it("excludes scheduled games before the window", () => {
    expect(
      isGameInCreateList(
        { status: "scheduled", startsAt: new Date("2026-09-24T12:00:00Z") },
        from,
        to,
      ),
    ).toBe(false);
  });

  it("excludes terminal games", () => {
    expect(
      isGameInCreateList(
        { status: "final", startsAt: new Date("2026-09-24T19:00:00Z") },
        from,
        to,
      ),
    ).toBe(false);
  });

  it("builds a PostgREST filter that keeps live games past kickoff", () => {
    const filter = buildCreateGamesOrFilter(from, to);
    expect(filter).toContain("status.eq.live");
    expect(filter).toContain("status.eq.scheduled");
    expect(filter).not.toContain("status.eq.final");
  });

  it("listStoredGames uses the widened filter", () => {
    const syncSource = readFileSync(
      join(process.cwd(), "lib/games/sync.ts"),
      "utf8",
    );
    expect(syncSource).toMatch(/buildCreateGamesOrFilter/);
    expect(syncSource).not.toMatch(
      /\.gte\("starts_at", params\.from\.toISOString\(\)\)/,
    );
  });
});
