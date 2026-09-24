import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("schema BUILD alignment", () => {
  const schemaSql = readFileSync(
    join(process.cwd(), "drizzle/0000_initial_schema.sql"),
    "utf8",
  );
  const schemaTs = readFileSync(join(process.cwd(), "lib/db/schema.ts"), "utf8");

  it("profiles.auth_user_id references auth.users ON DELETE SET NULL (SQL)", () => {
    expect(schemaSql).toMatch(
      /FOREIGN KEY \("auth_user_id"\) REFERENCES "auth"\."users"\("id"\) ON DELETE set null/i,
    );
  });

  it("profiles.referred_by references profiles(id) (SQL)", () => {
    expect(schemaSql).toMatch(
      /FOREIGN KEY \("referred_by"\) REFERENCES "public"\."profiles"\("id"\)/,
    );
  });

  it("profiles.auth_user_id references auth.users ON DELETE SET NULL (Drizzle)", () => {
    expect(schemaTs).toContain(".references(() => authUsers.id, { onDelete: \"set null\" })");
  });

  it("profiles.referred_by references profiles(id) (Drizzle)", () => {
    expect(schemaTs).toContain("profiles_referred_by_profiles_id_fk");
  });

  it("challenges.rematch_of references challenges(id) (SQL + Drizzle)", () => {
    expect(schemaSql).toMatch(
      /FOREIGN KEY \("rematch_of"\) REFERENCES "public"\."challenges"\("id"\)/,
    );
    expect(schemaTs).toContain("challenges_rematch_of_challenges_id_fk");
  });

  it("messages.body has char_length <= 280 check (SQL + Drizzle)", () => {
    expect(schemaSql).toMatch(/messages_body_check.*char_length\("body"\) <= 280/);
    expect(schemaTs).toContain("messages_body_check");
    expect(schemaTs).toContain("char_length(${t.body}) <= 280");
  });
});
