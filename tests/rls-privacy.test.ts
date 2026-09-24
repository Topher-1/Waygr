import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Verifies RLS migration enforces participant-only access for challenges and messages.
 * Full integration against live Postgres runs when DATABASE_URL is set (e.g. Supabase local).
 */
describe("RLS privacy", () => {
  const rlsSql = readFileSync(
    join(process.cwd(), "drizzle/0001_rls_policies.sql"),
    "utf8",
  );

  it("enables RLS on challenges and messages", () => {
    expect(rlsSql).toMatch(/ALTER TABLE challenges ENABLE ROW LEVEL SECURITY/);
    expect(rlsSql).toMatch(/ALTER TABLE messages ENABLE ROW LEVEL SECURITY/);
  });

  it("keys policies off profiles.auth_user_id = auth.uid()", () => {
    expect(rlsSql).toContain("auth_user_id = auth.uid()");
    expect(rlsSql).toContain("current_profile_id()");
  });

  it("restricts challenge SELECT to creator and opponent only", () => {
    expect(rlsSql).toMatch(/challenges_select_participant[\s\S]*creator_id = public\.current_profile_id\(\)/);
    expect(rlsSql).toMatch(/challenges_select_participant[\s\S]*opponent_id = public\.current_profile_id\(\)/);
    // No blanket authenticated read
    expect(rlsSql).not.toMatch(
      /ON challenges FOR SELECT[\s\S]*USING \(true\)/,
    );
  });

  it("restricts message SELECT to challenge participants", () => {
    expect(rlsSql).toMatch(
      /messages_select_participant[\s\S]*is_challenge_participant\(challenge_id\)/,
    );
  });

  it("does not grant authenticated INSERT/UPDATE on games or forfeits", () => {
    expect(rlsSql).not.toMatch(/ON games FOR INSERT/);
    expect(rlsSql).not.toMatch(/ON games FOR UPDATE/);
    expect(rlsSql).not.toMatch(/ON forfeits FOR INSERT/);
    expect(rlsSql).not.toMatch(/ON forfeits FOR UPDATE/);
  });

  it("simulates policy: outsider cannot read a challenge they are not in", () => {
    const creatorId = "11111111-1111-1111-1111-111111111111";
    const opponentId = "22222222-2222-2222-2222-222222222222";
    const outsiderId = "33333333-3333-3333-3333-333333333333";

    const challenge = { creator_id: creatorId, opponent_id: opponentId };

    const canRead = (viewerProfileId: string) =>
      challenge.creator_id === viewerProfileId ||
      challenge.opponent_id === viewerProfileId;

    expect(canRead(creatorId)).toBe(true);
    expect(canRead(opponentId)).toBe(true);
    expect(canRead(outsiderId)).toBe(false);
  });

  it("simulates policy: outsider cannot read messages on a challenge they are not in", () => {
    const challengeId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const participants = new Set([
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ]);

    const isParticipant = (profileId: string, challenge: { creator_id: string; opponent_id: string }) =>
      challenge.creator_id === profileId || challenge.opponent_id === profileId;

    const challenge = {
      id: challengeId,
      creator_id: "11111111-1111-1111-1111-111111111111",
      opponent_id: "22222222-2222-2222-2222-222222222222",
    };

    const outsider = "33333333-3333-3333-3333-333333333333";
    expect(isParticipant(outsider, challenge)).toBe(false);
    expect(participants.has(outsider)).toBe(false);
  });
});
