import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("GET /api/games auth gate", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/api/games/route.ts"),
    "utf8",
  );

  it("requires authentication before schedule sync", () => {
    expect(routeSource).toMatch(/getUser\(\)/);
    expect(routeSource).toMatch(/unauthorized/);
    expect(routeSource).toMatch(/listGamesForCreate\([\s\S]*sync:\s*true/);
  });

  it("does not call sync without auth check first", () => {
    const authIndex = routeSource.indexOf("getUser()");
    const syncIndex = routeSource.indexOf("sync: true");
    expect(authIndex).toBeGreaterThan(-1);
    expect(syncIndex).toBeGreaterThan(authIndex);
  });
});
