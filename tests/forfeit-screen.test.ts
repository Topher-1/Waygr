import { describe, expect, it } from "vitest";
import { screenCustomForfeit } from "@/lib/forfeit-screen";

describe("screenCustomForfeit", () => {
  it("allows safe custom text", () => {
    expect(screenCustomForfeit("Wear a rival jersey to work")).toEqual({ ok: true });
  });

  it("rejects money terms", () => {
    expect(screenCustomForfeit("Pay me $20 on Venmo")).toEqual({
      ok: false,
      reason: "banned",
    });
  });

  it("rejects alcohol terms", () => {
    expect(screenCustomForfeit("Buy beers for the group")).toEqual({
      ok: false,
      reason: "banned",
    });
  });

  it("rejects text over 80 characters", () => {
    expect(screenCustomForfeit("a".repeat(81))).toEqual({
      ok: false,
      reason: "too_long",
    });
  });
});
