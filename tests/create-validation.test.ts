import { describe, expect, it } from "vitest";
import { validateCreate } from "@/lib/challenges/create";

describe("validateCreate", () => {
  const baseBody = {
    gameId: "game-1",
    market: "spread",
    creatorPick: "home",
    line: -3.5,
    forfeitKind: "concession",
  };

  const adult = new Date("2026-01-01T00:00:00Z");

  it("allows create during a live game", () => {
    const result = validateCreate(baseBody, {
      gameStatus: "live",
      adultConfirmedAt: adult,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects create when game is final", () => {
    const result = validateCreate(baseBody, {
      gameStatus: "final",
      adultConfirmedAt: adult,
    });
    expect(result).toEqual({ ok: false, reason: "game_over" });
  });

  it("requires adult confirmation", () => {
    const result = validateCreate(baseBody, {
      gameStatus: "scheduled",
      adultConfirmedAt: null,
    });
    expect(result).toEqual({ ok: false, reason: "adult_required" });
  });

  it("rejects spread pick that is not home or away", () => {
    const result = validateCreate(
      { ...baseBody, creatorPick: "over" },
      { gameStatus: "scheduled", adultConfirmedAt: adult },
    );
    expect(result).toEqual({ ok: false, reason: "invalid_pick" });
  });

  it("rejects invalid forfeit kind", () => {
    const result = validateCreate(
      { ...baseBody, forfeitKind: "money" },
      { gameStatus: "scheduled", adultConfirmedAt: adult },
    );
    expect(result).toEqual({ ok: false, reason: "invalid_forfeit_kind" });
  });

  it("allows honor-system drink and money custom forfeits", () => {
    const ctx = { gameStatus: "scheduled", adultConfirmedAt: adult };

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
    expect(
      validateCreate(
        { ...baseBody, forfeitKind: "custom", forfeitText: "a beer + $10" },
        ctx,
      ).ok,
    ).toBe(true);
  });

  it("rejects payment-rail custom forfeit text", () => {
    const result = validateCreate(
      {
        ...baseBody,
        forfeitKind: "custom",
        forfeitText: "pay me on venmo.com/username",
      },
      { gameStatus: "scheduled", adultConfirmedAt: adult },
    );
    expect(result).toEqual({ ok: false, reason: "forfeit_screened" });
  });
});
