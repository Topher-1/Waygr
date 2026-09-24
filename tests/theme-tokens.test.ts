import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allowedColors, requiredCssVars, tokens } from "@/lib/theme";

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

function normalizeHex(hex: string): string {
  const h = hex.toLowerCase();
  if (h.length === 4) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

function extractHexColors(content: string): string[] {
  return [...content.matchAll(HEX_RE)].map((m) => normalizeHex(m[0]));
}

describe("theme tokens", () => {
  it("exports every required CSS variable in tokens.css", () => {
    const css = readFileSync(join(process.cwd(), "styles/tokens.css"), "utf8");
    for (const varName of requiredCssVars) {
      expect(css).toContain(varName);
    }
  });

  it("keeps CSS vars aligned with the theme module", () => {
    const css = readFileSync(join(process.cwd(), "styles/tokens.css"), "utf8");
    const darkBlock = css.split("@media")[0];
    expect(darkBlock).toContain(`--bg: ${tokens.dark.bg.toLowerCase()}`);
    expect(darkBlock).toContain(`--orange: ${tokens.dark.orange.toLowerCase()}`);
    expect(darkBlock).toContain(`--blue: ${tokens.dark.blue.toLowerCase()}`);
  });

  it("fails when app source invents off-palette hex colors", () => {
    const roots = ["app", "lib", "styles"];
    const offenders: string[] = [];

    for (const root of roots) {
      const dir = join(process.cwd(), root);
      for (const file of walk(dir)) {
        if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
        if (file.endsWith("theme.ts")) continue;
        if (file.endsWith("tokens.css")) continue;

        const content = readFileSync(file, "utf8");
        for (const hex of extractHexColors(content)) {
          const allowed = [...allowedColors].some(
            (c) => c.toLowerCase() === hex.toLowerCase(),
          );
          if (!allowed) {
            offenders.push(`${file}: ${hex}`);
          }
        }
      }
    }

    expect(offenders, `Off-palette colors found:\n${offenders.join("\n")}`).toEqual([]);
  });
});

function walk(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      files.push(...walk(full));
    } else if (/\.(tsx?|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}
