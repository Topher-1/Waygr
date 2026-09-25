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

  it("excludes live games that started before the window", () => {
    expect(
      isGameInCreateList(
        { status: "live", startsAt: new Date("2026-09-24T19:00:00Z") },
        from,
        to,
      ),
    ).toBe(false);
  });

  it("includes live games that started inside the window", () => {
    expect(
      isGameInCreateList(
        { status: "live", startsAt: new Date("2026-09-24T21:00:00Z") },
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

  it("builds a PostgREST filter that bounds live games by from and to", () => {
    const filter = buildCreateGamesOrFilter(from, to);
    expect(filter).toContain("status.eq.live");
    expect(filter).toContain(`starts_at.gte.${from.toISOString()}`);
    expect(filter).toContain("status.eq.scheduled");
    expect(filter).not.toContain("status.eq.final");
  });

  it("drops stale Thursday live games on a Friday afternoon picker window", () => {
    const fridayStart = new Date("2026-09-25T05:00:00.000Z"); // Fri 00:00 CT (CDT)
    const fridayEnd = new Date("2026-10-02T05:00:00.000Z");

    const thursdayStaleLive = {
      status: "live",
      startsAt: new Date("2026-09-24T18:10:00.000Z"), // Thu 1:10 PM CT
    };
    const fridayMorningLive = {
      status: "live",
      startsAt: new Date("2026-09-25T17:05:00.000Z"), // Fri 12:05 PM CT
    };
    const fridayEveningScheduled = {
      status: "scheduled",
      startsAt: new Date("2026-09-25T23:40:00.000Z"), // Fri 6:40 PM CT
    };

    expect(isGameInCreateList(thursdayStaleLive, fridayStart, fridayEnd)).toBe(
      false,
    );
    expect(isGameInCreateList(fridayMorningLive, fridayStart, fridayEnd)).toBe(
      true,
    );
    expect(
      isGameInCreateList(fridayEveningScheduled, fridayStart, fridayEnd),
    ).toBe(true);
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
