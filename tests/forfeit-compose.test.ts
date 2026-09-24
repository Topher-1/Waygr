import { describe, expect, it } from "vitest";
import { composeForfeit } from "@/lib/forfeit-compose";

describe("composeForfeit", () => {
  it("returns null when nothing is selected", () => {
    expect(composeForfeit({ presetIds: [] })).toBeNull();
    expect(composeForfeit({ presetIds: [], customText: "   " })).toBeNull();
  });

  it("keeps a single classic preset as its native kind", () => {
    expect(composeForfeit({ presetIds: ["concession"] })).toEqual({
      kind: "concession",
      text: null,
      displayStake: "Concession card",
    });
    expect(composeForfeit({ presetIds: ["jersey_swap"] })).toEqual({
      kind: "jersey_swap",
      text: null,
      displayStake: "Jersey swap",
    });
  });

  it("keeps a single custom preset as custom kind", () => {
    expect(composeForfeit({ presetIds: ["beer"] })).toEqual({
      kind: "custom",
      text: "a beer",
      displayStake: "A beer",
    });
  });

  it("composes multiple presets into one custom forfeit", () => {
    expect(composeForfeit({ presetIds: ["beer", "money_10"] })).toEqual({
      kind: "custom",
      text: "a beer + $10",
      displayStake: "A beer + $10",
    });
  });

  it("composes classic presets with drink/food/money presets", () => {
    expect(composeForfeit({ presetIds: ["beer", "concession"] })).toEqual({
      kind: "custom",
      text: "a beer + a concession card",
      displayStake: "A beer + Concession card",
    });
  });

  it("stacks freeform custom text with presets", () => {
    expect(
      composeForfeit({ presetIds: ["money_10"], customText: "nachos" }),
    ).toEqual({
      kind: "custom",
      text: "$10 + nachos",
      displayStake: "$10 + nachos",
    });
  });
});
