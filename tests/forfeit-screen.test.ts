import { describe, expect, it } from "vitest";
import { screenCustomForfeit } from "@/lib/forfeit-screen";

describe("screenCustomForfeit", () => {
  it("allows safe custom text", () => {
    expect(screenCustomForfeit("Wear a rival jersey to work")).toEqual({ ok: true });
  });

  it("allows alcohol and drink stakes", () => {
    expect(screenCustomForfeit("a beer")).toEqual({ ok: true });
    expect(screenCustomForfeit("a round of drinks")).toEqual({ ok: true });
    expect(screenCustomForfeit("buy me a whiskey")).toEqual({ ok: true });
    expect(screenCustomForfeit("Buy beers for the group")).toEqual({ ok: true });
  });

  it("allows honor-system money amounts", () => {
    expect(screenCustomForfeit("$5")).toEqual({ ok: true });
    expect(screenCustomForfeit("$10")).toEqual({ ok: true });
    expect(screenCustomForfeit("ten bucks")).toEqual({ ok: true });
    expect(screenCustomForfeit("Venmo me later")).toEqual({ ok: true });
    expect(screenCustomForfeit("owes me $20")).toEqual({ ok: true });
  });

  it("allows food stakes", () => {
    expect(screenCustomForfeit("wings")).toEqual({ ok: true });
    expect(screenCustomForfeit("loser buys pizza")).toEqual({ ok: true });
  });

  it("blocks payment rails and deep links", () => {
    expect(screenCustomForfeit("pay me on venmo.com/username")).toEqual({
      ok: false,
      reason: "payment_rail",
    });
    expect(screenCustomForfeit("https://cash.app/$waygr")).toEqual({
      ok: false,
      reason: "payment_rail",
    });
    expect(screenCustomForfeit("use Stripe checkout")).toEqual({
      ok: false,
      reason: "payment_rail",
    });
    expect(screenCustomForfeit("Apple Pay me now")).toEqual({
      ok: false,
      reason: "payment_rail",
    });
  });

  it("blocks dangerous terms", () => {
    expect(screenCustomForfeit("punch them in the face")).toEqual({
      ok: false,
      reason: "dangerous",
    });
  });

  it("rejects empty and overlong text", () => {
    expect(screenCustomForfeit("   ")).toEqual({ ok: false, reason: "empty" });
    expect(screenCustomForfeit("a".repeat(81))).toEqual({
      ok: false,
      reason: "too_long",
    });
  });
});
