import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("brand link preview assets", () => {
  it("serves apple-touch-icon and home OG from the Designer brand pack", () => {
    const appDir = join(process.cwd(), "app");
    expect(existsSync(join(appDir, "apple-icon.png"))).toBe(true);
    expect(existsSync(join(appDir, "opengraph-image.png"))).toBe(true);
    expect(existsSync(join(appDir, "favicon.ico"))).toBe(true);
  });

  it("keeps source brand pack PNGs for rebuild reference", () => {
    const brandDir = join(process.cwd(), "docs/brand");
    expect(existsSync(join(brandDir, "icon-180.png"))).toBe(true);
    expect(existsSync(join(brandDir, "template-link-preview-1200x630.png"))).toBe(
      true,
    );
  });
});
