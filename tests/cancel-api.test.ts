import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateCancel } from "@/lib/challenges/cancel";

describe("POST /api/challenges/[id]/cancel fail-closed", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/api/challenges/[id]/cancel/route.ts"),
    "utf8",
  );

  it("validates cancel before update", () => {
    expect(routeSource).toMatch(/validateCancel/);
    const validationIndex = routeSource.indexOf("validateCancel");
    const updateIndex = routeSource.indexOf('.update({ state: "canceled" })');
    expect(validationIndex).toBeGreaterThan(-1);
    expect(updateIndex).toBeGreaterThan(validationIndex);
  });

  it("atomically updates only open challenges", () => {
    expect(routeSource).toMatch(/\.eq\("state", "open"\)/);
    expect(routeSource).toMatch(/reason: "not_open"/);
    expect(routeSource).toMatch(/status: 409/);
  });

  it("rejects accepted challenges via validateCancel", () => {
    expect(
      validateCancel({
        challengeState: "accepted",
        creatorId: "creator-1",
        actorProfileId: "creator-1",
      }),
    ).toEqual({ ok: false, reason: "not_open" });
  });

  it("rejects live challenges via validateCancel", () => {
    expect(
      validateCancel({
        challengeState: "live",
        creatorId: "creator-1",
        actorProfileId: "creator-1",
      }),
    ).toEqual({ ok: false, reason: "not_open" });
  });

  it("rejects already-canceled challenges via validateCancel", () => {
    expect(
      validateCancel({
        challengeState: "canceled",
        creatorId: "creator-1",
        actorProfileId: "creator-1",
      }),
    ).toEqual({ ok: false, reason: "not_open" });
  });
});
