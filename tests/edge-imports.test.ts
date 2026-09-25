import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const IMPORT_MAP_PATH = join(ROOT, "supabase/functions/import_map.json");
const CONFIG_PATH = join(ROOT, "supabase/config.toml");
const EDGE_FUNCTIONS = ["poll-scores", "settle", "sweep"] as const;

function denoAvailable(): boolean {
  try {
    execSync("deno --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

describe("edge function import hygiene", () => {
  it("shared import_map maps @/ to repo root and pins supabase-js for Deno", () => {
    const map = JSON.parse(readFileSync(IMPORT_MAP_PATH, "utf8")) as {
      imports: Record<string, string>;
    };

    expect(map.imports["@/"]).toBe("../../");
    expect(map.imports["@supabase/supabase-js"]).toContain("esm.sh/@supabase/supabase-js");
  });

  it("config.toml wires import_map for every edge function", () => {
    const config = readFileSync(CONFIG_PATH, "utf8");

    for (const fn of EDGE_FUNCTIONS) {
      const section = config.match(new RegExp(`\\[functions\\.${fn}\\]([\\s\\S]*?)(?=\\n\\[|$)`))?.[1];
      expect(section, `missing [functions.${fn}] section`).toBeTruthy();
      expect(section).toContain('import_map = "./functions/import_map.json"');
    }
  });

  it("lib/jobs keep extensionless @/ imports for Next/tsconfig", () => {
    const pollScores = readFileSync(join(ROOT, "lib/jobs/poll-scores.ts"), "utf8");
    expect(pollScores).toMatch(/from '@\/lib\/scores\/balldontlie'/);
    expect(pollScores).not.toMatch(/from '@\/lib\/scores\/balldontlie\.ts'/);
  });

  it("deno check passes for all edge functions when deno is installed", () => {
    if (!denoAvailable()) return;

    for (const fn of EDGE_FUNCTIONS) {
      execSync(
        `deno check --import-map=supabase/functions/import_map.json supabase/functions/${fn}/index.ts`,
        { stdio: "pipe", cwd: ROOT },
      );
    }
  });
});
