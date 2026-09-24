import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allCopyStrings } from "@/lib/copy";

const BANNED = /\b(bet|wager|odds|payout)\b/i;

describe("copy banned words", () => {
  it("has no banned whole words in lib/copy.ts literals", () => {
    const source = readFileSync(join(process.cwd(), "lib/copy.ts"), "utf8");
    const literals = [...source.matchAll(/"([^"\\]|\\.)*"/g)].map((m) => m[0].slice(1, -1));

    for (const literal of literals) {
      expect(literal, `banned word in literal: "${literal}"`).not.toMatch(BANNED);
    }
  });

  it("has no banned whole words in exported copy strings", () => {
    for (const str of allCopyStrings()) {
      expect(str, `banned word in copy: "${str}"`).not.toMatch(BANNED);
    }
  });
});
