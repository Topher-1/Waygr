import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WORDMARK_PATH,
  WORDMARK_VIEW_HEIGHT,
  WORDMARK_VIEW_WIDTH,
} from "@/lib/brand/marks";

describe("wordmark for OG/share cards", () => {
  it("uses a taller artboard so y/g descenders are not clipped", () => {
    // Old clipped artboard was 782 px tall; full descenders need ~981 px.
    expect(WORDMARK_VIEW_HEIGHT).toBeGreaterThan(782);
    expect(WORDMARK_VIEW_WIDTH).toBeGreaterThan(2200);
  });

  it("ships a longer path than the clipped baseline-only export", () => {
    // Regenerated from Barlow Condensed with full descenders (not baseline-trimmed).
    expect(WORDMARK_PATH.length).toBeGreaterThan(3000);
    expect(WORDMARK_PATH).toContain("932.0");
  });

  it("scales height from the full artboard aspect ratio", () => {
    const width = 200;
    const height = Math.round(
      (width * WORDMARK_VIEW_HEIGHT) / WORDMARK_VIEW_WIDTH,
    );
    // Was 70 px at width 200 with the clipped 782-tall artboard.
    expect(height).toBeGreaterThan(70);
    expect(height).toBe(86);
  });

  it("flips the font-export path so Satori cards draw Waygr upright", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/cards/marks.tsx"),
      "utf8",
    );
    expect(src).toContain("scale(1 -1)");
    expect(src).toContain("WORDMARK_VIEW_HEIGHT}) scale(1 -1)");
  });
});
