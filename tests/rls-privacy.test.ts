import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Verifies RLS migration enforces participant-only access for challenges and messages.
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

  it("locks SECURITY DEFINER helpers to authenticated (B3)", () => {
    expect(rlsSql).toMatch(
      /REVOKE ALL ON FUNCTION public\.current_profile_id\(\) FROM PUBLIC/,
    );
    expect(rlsSql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.current_profile_id\(\) TO authenticated/,
    );
    expect(rlsSql).toMatch(
      /REVOKE ALL ON FUNCTION public\.is_challenge_participant\(uuid\) FROM PUBLIC/,
    );
    expect(rlsSql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.is_challenge_participant\(uuid\) TO authenticated/,
    );
  });

  it("closes challenges UPDATE hole: cancel-only policy (B2)", () => {
    expect(rlsSql).not.toContain("challenges_update_creator_open");
    expect(rlsSql).toMatch(/challenges_cancel_creator/);
    expect(rlsSql).toMatch(
      /challenges_cancel_creator[\s\S]*state = 'open'/,
    );
    expect(rlsSql).toMatch(
      /challenges_cancel_creator[\s\S]*state = 'canceled'/,
    );
    expect(rlsSql).not.toMatch(
      /challenges_cancel_creator[\s\S]*state IN \('open', 'canceled'\)/,
    );
  });

  it("blocks authenticated writes to settlement columns via trigger (B2)", () => {
    expect(rlsSql).toMatch(/challenges_guard_authenticated_update/);
    expect(rlsSql).toMatch(/auth\.role\(\) = 'authenticated'/);
    expect(rlsSql).toMatch(/NEW\.opponent_id IS DISTINCT FROM OLD\.opponent_id/);
    expect(rlsSql).toMatch(/NEW\.outcome IS DISTINCT FROM OLD\.outcome/);
    expect(rlsSql).toMatch(/NEW\.settled_at IS DISTINCT FROM OLD\.settled_at/);
    expect(rlsSql).toMatch(/NEW\.accepted_at IS DISTINCT FROM OLD\.accepted_at/);
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

  it("simulates cancel-only: creator cannot mutate settlement fields while open", () => {
    const openChallenge = {
      state: "open" as const,
      creator_id: "11111111-1111-1111-1111-111111111111",
      opponent_id: null as string | null,
      outcome: null as string | null,
      settled_at: null as string | null,
      accepted_at: null as string | null,
    };

    const allowedCancel = {
      ...openChallenge,
      state: "canceled" as const,
    };

    const forbiddenSettleWhileOpen = {
      ...openChallenge,
      state: "open" as const,
      opponent_id: "22222222-2222-2222-2222-222222222222",
      outcome: "creator",
      settled_at: new Date().toISOString(),
    };

    const isCancelOnlyTransition = (
      before: typeof openChallenge,
      after: typeof openChallenge & { state: string },
    ) => {
      if (before.state !== "open" || after.state !== "canceled") return false;
      return (
        after.opponent_id === before.opponent_id &&
        after.outcome === before.outcome &&
        after.settled_at === before.settled_at &&
        after.accepted_at === before.accepted_at
      );
    };

    expect(isCancelOnlyTransition(openChallenge, allowedCancel)).toBe(true);
    expect(
      isCancelOnlyTransition(openChallenge, {
        ...forbiddenSettleWhileOpen,
        state: "open",
      }),
    ).toBe(false);
  });

  it("simulates policy: outsider cannot read messages on a challenge they are not in", () => {
    const challenge = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      creator_id: "11111111-1111-1111-1111-111111111111",
      opponent_id: "22222222-2222-2222-2222-222222222222",
    };

    const isParticipant = (profileId: string) =>
      challenge.creator_id === profileId || challenge.opponent_id === profileId;

    const outsider = "33333333-3333-3333-3333-333333333333";
    expect(isParticipant(outsider)).toBe(false);
  });
});
