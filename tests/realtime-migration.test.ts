import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("realtime publication migration", () => {
  const sql = readFileSync(
    join(process.cwd(), "drizzle/0007_realtime_publication.sql"),
    "utf8",
  );

  it("adds games, challenges, and messages to supabase_realtime", () => {
    expect(sql).toMatch(
      /ALTER PUBLICATION supabase_realtime ADD TABLE games/,
    );
    expect(sql).toMatch(
      /ALTER PUBLICATION supabase_realtime ADD TABLE challenges/,
    );
    expect(sql).toMatch(
      /ALTER PUBLICATION supabase_realtime ADD TABLE messages/,
    );
  });
});
