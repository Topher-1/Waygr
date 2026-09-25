import { describe, expect, it } from "vitest";
import {
  canMarkDone,
  canReviewProof,
  canShareConcession,
  canSubmitProof,
  checkProofUpload,
  hoursUntilAutoConfirm,
  isJerseyActive,
  isProofAutoConfirmDue,
  jerseyDaysRemaining,
  MAX_PROOF_BYTES,
  PROOF_AUTO_CONFIRM_MS,
  proofObjectPath,
  resolveForfeitRole,
} from "@/lib/forfeits/actions";

const forfeit = {
  owedBy: "loser",
  owedTo: "winner",
  kind: "custom" as const,
  status: "owed" as const,
};

describe("forfeit roles", () => {
  it("places each party on their own side", () => {
    expect(resolveForfeitRole(forfeit, "loser")).toBe("loser");
    expect(resolveForfeitRole(forfeit, "winner")).toBe("winner");
  });

  it("gives outsiders and signed-out viewers no role", () => {
    expect(resolveForfeitRole(forfeit, "someone-else")).toBeNull();
    expect(resolveForfeitRole(forfeit, null)).toBeNull();
  });
});

describe("forfeit permissions", () => {
  it("lets only the loser share a concession card while owed", () => {
    expect(canShareConcession({ ...forfeit, kind: "concession" }, "loser")).toBe(
      true,
    );
    expect(canShareConcession({ ...forfeit, kind: "concession" }, "winner")).toBe(
      false,
    );
    expect(
      canShareConcession(
        { ...forfeit, kind: "concession", status: "proof_submitted" },
        "loser",
      ),
    ).toBe(false);
  });

  it("lets the loser mark honor-system done while owed (not jersey)", () => {
    expect(canMarkDone(forfeit, "loser")).toBe(true);
    expect(canMarkDone(forfeit, "winner")).toBe(false);
    expect(
      canMarkDone({ ...forfeit, status: "proof_submitted" }, "loser"),
    ).toBe(false);
    expect(
      canMarkDone(
        { ...forfeit, kind: "jersey_swap" as const, status: "owed" },
        "loser",
      ),
    ).toBe(false);
  });

  it("lets only the loser upload proof, and only while owed", () => {
    expect(canSubmitProof(forfeit, "loser")).toBe(true);
    expect(canSubmitProof({ ...forfeit, status: "proof_submitted" }, "loser")).toBe(
      false,
    );
    expect(canSubmitProof(forfeit, "winner")).toBe(false);
  });

  it("lets only the winner review submitted proof", () => {
    const submitted = { ...forfeit, status: "proof_submitted" as const };
    expect(canReviewProof(submitted, "winner")).toBe(true);
    expect(canReviewProof(submitted, "loser")).toBe(false);
    expect(canReviewProof(forfeit, "winner")).toBe(false);
    expect(canReviewProof({ ...forfeit, status: "paid" }, "winner")).toBe(false);
  });
});

describe("proof auto-confirm window", () => {
  const submitted = new Date("2026-11-15T18:00:00.000Z");

  it("is 72 hours", () => {
    expect(PROOF_AUTO_CONFIRM_MS).toBe(72 * 60 * 60 * 1000);
  });

  it("does not fire before 72 hours", () => {
    const justShort = new Date(submitted.getTime() + PROOF_AUTO_CONFIRM_MS - 1000);
    expect(isProofAutoConfirmDue(submitted, justShort)).toBe(false);
    expect(hoursUntilAutoConfirm(submitted, justShort)).toBe(1);
  });

  it("fires at exactly 72 hours and after", () => {
    expect(
      isProofAutoConfirmDue(submitted, new Date(submitted.getTime() + PROOF_AUTO_CONFIRM_MS)),
    ).toBe(true);
    expect(
      isProofAutoConfirmDue(
        submitted.toISOString(),
        new Date(submitted.getTime() + PROOF_AUTO_CONFIRM_MS * 2),
      ),
    ).toBe(true);
  });

  it("clamps the countdown at zero once it's past", () => {
    expect(
      hoursUntilAutoConfirm(submitted, new Date(submitted.getTime() + PROOF_AUTO_CONFIRM_MS + 1)),
    ).toBe(0);
  });
});

describe("proof uploads", () => {
  it("accepts photos and short clips inside the size cap", () => {
    expect(checkProofUpload({ contentType: "image/jpeg", size: 1024 })).toEqual({
      ok: true,
    });
    expect(checkProofUpload({ contentType: "video/mp4", size: MAX_PROOF_BYTES })).toEqual(
      { ok: true },
    );
  });

  it("rejects other file types and oversized files", () => {
    expect(checkProofUpload({ contentType: "application/pdf", size: 10 })).toEqual({
      ok: false,
      reason: "mime",
    });
    expect(
      checkProofUpload({ contentType: "image/png", size: MAX_PROOF_BYTES + 1 }),
    ).toEqual({ ok: false, reason: "size" });
    expect(checkProofUpload({ contentType: "image/png", size: 0 })).toEqual({
      ok: false,
      reason: "size",
    });
  });

  it("namespaces the storage object under its forfeit", () => {
    expect(proofObjectPath("f-1", "image/jpeg", 1700)).toBe("f-1/1700.jpg");
    expect(proofObjectPath("f-1", "video/quicktime", 1700)).toBe("f-1/1700.mov");
  });
});

describe("jersey frame window", () => {
  const settled = new Date("2026-11-15T23:00:00.000Z");
  const until = new Date(settled.getTime() + 7 * 24 * 60 * 60 * 1000);
  const profile = { jerseyTeam: "KC", jerseyUntil: until.toISOString() };

  it("shows for the seven days after settlement", () => {
    expect(isJerseyActive(profile, settled)).toBe(true);
    expect(jerseyDaysRemaining(profile, settled)).toBe(7);

    const daySix = new Date(settled.getTime() + 6 * 24 * 60 * 60 * 1000);
    expect(isJerseyActive(profile, daySix)).toBe(true);
    expect(jerseyDaysRemaining(profile, daySix)).toBe(1);
  });

  it("disappears once the window closes", () => {
    expect(isJerseyActive(profile, until)).toBe(false);
    expect(
      isJerseyActive(profile, new Date(until.getTime() + 1000)),
    ).toBe(false);
    expect(jerseyDaysRemaining(profile, until)).toBe(0);
  });

  it("is off when no jersey forfeit is active", () => {
    expect(isJerseyActive({ jerseyTeam: null, jerseyUntil: null }, settled)).toBe(false);
    expect(isJerseyActive({ jerseyTeam: "KC", jerseyUntil: null }, settled)).toBe(false);
  });
});
