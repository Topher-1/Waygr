import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("accept_challenge_atomic migration", () => {
  const sql0004 = readFileSync(
    join(process.cwd(), "drizzle/0004_accept_challenge_atomic.sql"),
    "utf8",
  );
  const sql0005 = readFileSync(
    join(process.cwd(), "drizzle/0005_accept_challenge_atomic_kickoff_where.sql"),
    "utf8",
  );

  it("0004 defines atomic accept RPC with race-safe conditional update", () => {
    expect(sql0004).toContain("accept_challenge_atomic");
    expect(sql0004).toMatch(/state = 'open'/);
    expect(sql0004).toMatch(/creator_id <> p_opponent_id/);
    expect(sql0004).toMatch(/opponent_id IS NULL/);
  });

  it("0004 grants execute to service_role only", () => {
    expect(sql0004).toMatch(/GRANT EXECUTE ON FUNCTION public\.accept_challenge_atomic/);
    expect(sql0004).toContain("TO service_role");
  });

  it("0005 folds kickoff into the same UPDATE WHERE (B1 TOCTOU fix)", () => {
    expect(sql0005).toContain("accept_challenge_atomic");
    expect(sql0005).toMatch(/UPDATE challenges[\s\S]*FROM games g/);
    expect(sql0005).toMatch(/g\.starts_at > now\(\)/);
    expect(sql0005).toMatch(/state = 'open'/);
    expect(sql0005).toMatch(/creator_id <> p_opponent_id/);
    expect(sql0005).toMatch(/opponent_id IS NULL/);

    const beforeUpdate = sql0005.split(/UPDATE challenges/)[0] ?? "";
    expect(beforeUpdate).not.toMatch(/IF v_kickoff <= now\(\)/);
  });

  it("0005 returns past_kickoff only after atomic UPDATE fails", () => {
    expect(sql0005).toMatch(/IF NOT FOUND[\s\S]*past_kickoff/);
    expect(sql0005).toMatch(/REVOKE ALL ON FUNCTION public\.accept_challenge_atomic/);
    expect(sql0005).toMatch(/GRANT EXECUTE ON FUNCTION public\.accept_challenge_atomic/);
    expect(sql0005).toContain("TO service_role");
  });
});
