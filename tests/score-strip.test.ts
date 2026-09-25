import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ScoreStrip", () => {
  const source = readFileSync(
    join(process.cwd(), "components/challenge/score-strip.tsx"),
    "utf8",
  );

  it("keeps scores visible when the feed is stale but numbers exist", () => {
    expect(source).toMatch(/hasVisibleScores/);
    expect(source).toMatch(/stale && isLive && !hasVisibleScores/);
    expect(source).toMatch(/showLagging/);
  });
});
