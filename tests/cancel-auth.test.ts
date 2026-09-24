import { describe, expect, it } from "vitest";
import { validateCancel } from "@/lib/challenges/cancel";

describe("validateCancel", () => {
  it("allows creator to cancel open challenge", () => {
    const result = validateCancel({
      challengeState: "open",
      creatorId: "creator-1",
      actorProfileId: "creator-1",
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects non-creator", () => {
    const result = validateCancel({
      challengeState: "open",
      creatorId: "creator-1",
      actorProfileId: "other-1",
    });
    expect(result).toEqual({ ok: false, reason: "not_creator" });
  });

  it("rejects when not open", () => {
    const result = validateCancel({
      challengeState: "accepted",
      creatorId: "creator-1",
      actorProfileId: "creator-1",
    });
    expect(result).toEqual({ ok: false, reason: "not_open" });
  });
});
