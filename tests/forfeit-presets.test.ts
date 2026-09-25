import { describe, expect, it } from "vitest";
import { FORFEIT_PRESETS } from "@/lib/forfeit-presets";

describe("FORFEIT_PRESETS food category", () => {
  it("lists wings, pizza, dinner, garlic bread, and banana bread", () => {
    const foodPresets = FORFEIT_PRESETS.filter((preset) => preset.category === "food");

    expect(foodPresets.map((preset) => preset.id)).toEqual([
      "wings",
      "pizza",
      "dinner",
      "garlic_bread",
      "banana_bread",
    ]);
  });
});
