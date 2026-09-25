import { describe, expect, it } from "vitest";
import { formatSettledWaygrLine } from "@/lib/challenges/settled-history";
import type { SettledWaygr } from "@/lib/challenges/settled-history";

describe("settled history", () => {
  const base: SettledWaygr = {
    id: "c1",
    slug: "abc123",
    matchup: "BUF at KC",
    call: "KC -3.5",
    result: "win",
    settledAt: "2026-11-15T23:30:00.000Z",
    forfeitStatus: "none",
  };

  it("formats a win with no forfeit", () => {
    expect(formatSettledWaygrLine(base)).toBe(
      "BUF at KC · KC -3.5 · Called it",
    );
  });

  it("shows forfeit state in the line", () => {
    expect(
      formatSettledWaygrLine({ ...base, result: "loss", forfeitStatus: "owed" }),
    ).toContain("forfeit owed");
    expect(
      formatSettledWaygrLine({
        ...base,
        result: "loss",
        forfeitStatus: "proof_submitted",
      }),
    ).toContain("waiting on confirm");
    expect(
      formatSettledWaygrLine({ ...base, result: "loss", forfeitStatus: "paid" }),
    ).toContain("square");
  });

  it("links stay on /c/[slug] via slug field", () => {
    expect(base.slug).toBe("abc123");
  });
});
