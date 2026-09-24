import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Custom forfeit chip hit target", () => {
  it("exports a full-chip button with padding classes", () => {
    const source = readFileSync(
      join(process.cwd(), "components/create/custom-forfeit-chip.tsx"),
      "utf8",
    );
    expect(source).toContain("export function CustomForfeitChip");
    expect(source).toMatch(/<button[^>]*type="button"/);
    expect(source).toContain("rounded-full");
    expect(source).toContain("px-4");
    expect(source).toContain("py-2");
    expect(source).not.toMatch(/<a[\s>]/);
  });

  it("create sheet uses CustomForfeitChip instead of a text-only control", () => {
    const source = readFileSync(
      join(process.cwd(), "components/create/create-sheet.tsx"),
      "utf8",
    );
    expect(source).toContain("CustomForfeitChip");
    expect(source).toContain('setForfeitMode("custom")');
    expect(source).not.toMatch(
      /text-sm font-semibold[\s\S]*copy\.create\.forfeits\.custom/,
    );
  });
});
