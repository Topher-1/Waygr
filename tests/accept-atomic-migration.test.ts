import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("accept_challenge_atomic migration", () => {
  const sql = readFileSync(
    join(process.cwd(), "drizzle/0004_accept_challenge_atomic.sql"),
    "utf8",
  );

  it("defines atomic accept RPC with race-safe conditional update", () => {
    expect(sql).toContain("accept_challenge_atomic");
    expect(sql).toMatch(/state = 'open'/);
    expect(sql).toMatch(/creator_id <> p_opponent_id/);
    expect(sql).toMatch(/opponent_id IS NULL/);
  });

  it("grants execute to service_role only", () => {
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.accept_challenge_atomic/);
    expect(sql).toContain("TO service_role");
  });
});
