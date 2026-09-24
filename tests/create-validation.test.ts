import { describe, expect, it } from "vitest";
import { KICKOFF_LOCK_MS, validateCreate } from "@/lib/challenges/create";

describe("validateCreate", () => {
  const baseBody = {
    gameId: "game-1",
    market: "spread",
    creatorPick: "home",
    line: -3.5,
    forfeitKind: "concession",
  };

  const adult = new Date("2026-01-01T00:00:00Z");

  it("rejects create when kickoff is under 2 minutes away", () => {
    const now = new Date("2026-09-20T20:00:00Z");
    const kickoff = new Date(now.getTime() + KICKOFF_LOCK_MS - 1000);
    const result = validateCreate(baseBody, {
      kickoffAt: kickoff,
      now,
      adultConfirmedAt: adult,
    });
    expect(result).toEqual({ ok: false, reason: "kickoff_soon" });
  });

  it("allows create when kickoff is at least 2 minutes away", () => {
    const now = new Date("2026-09-20T20:00:00Z");
    const kickoff = new Date(now.getTime() + KICKOFF_LOCK_MS);
    const result = validateCreate(baseBody, {
      kickoffAt: kickoff,
      now,
      adultConfirmedAt: adult,
    });
    expect(result.ok).toBe(true);
  });

  it("requires adult confirmation", () => {
    const now = new Date("2026-09-20T20:00:00Z");
    const kickoff = new Date(now.getTime() + 3600_000);
    const result = validateCreate(baseBody, {
      kickoffAt: kickoff,
      now,
      adultConfirmedAt: null,
    });
    expect(result).toEqual({ ok: false, reason: "adult_required" });
  });

  it("rejects spread pick that is not home or away", () => {
    const now = new Date("2026-09-20T20:00:00Z");
    const kickoff = new Date(now.getTime() + 3600_000);
    const result = validateCreate(
      { ...baseBody, creatorPick: "over" },
      { kickoffAt: kickoff, now, adultConfirmedAt: adult },
    );
    expect(result).toEqual({ ok: false, reason: "invalid_pick" });
  });

  it("rejects invalid forfeit kind", () => {
    const now = new Date("2026-09-20T20:00:00Z");
    const kickoff = new Date(now.getTime() + 3600_000);
    const result = validateCreate(
      { ...baseBody, forfeitKind: "money" },
      { kickoffAt: kickoff, now, adultConfirmedAt: adult },
    );
    expect(result).toEqual({ ok: false, reason: "invalid_forfeit_kind" });
  });

  it("allows honor-system drink and money custom forfeits", () => {
    const now = new Date("2026-09-20T20:00:00Z");
    const kickoff = new Date(now.getTime() + 3600_000);
    const ctx = { kickoffAt: kickoff, now, adultConfirmedAt: adult };

    expect(
      validateCreate(
        { ...baseBody, forfeitKind: "custom", forfeitText: "a beer" },
        ctx,
      ).ok,
    ).toBe(true);
    expect(
      validateCreate(
        { ...baseBody, forfeitKind: "custom", forfeitText: "$10" },
        ctx,
      ).ok,
    ).toBe(true);
    expect(
      validateCreate(
        { ...baseBody, forfeitKind: "custom", forfeitText: "wings" },
        ctx,
      ).ok,
    ).toBe(true);
  });

  it("rejects payment-rail custom forfeit text", () => {
    const now = new Date("2026-09-20T20:00:00Z");
    const kickoff = new Date(now.getTime() + 3600_000);
    const result = validateCreate(
      {
        ...baseBody,
        forfeitKind: "custom",
        forfeitText: "pay me on venmo.com/username",
      },
      { kickoffAt: kickoff, now, adultConfirmedAt: adult },
    );
    expect(result).toEqual({ ok: false, reason: "forfeit_screened" });
  });
});
