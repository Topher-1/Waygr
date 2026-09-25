import type { ForfeitKind } from "@/lib/jobs/types";

export type ForfeitPresetCategory = "drink" | "food" | "money" | "classic";

export type ForfeitPreset = {
  id: string;
  category: ForfeitPresetCategory;
  label: string;
  kind: ForfeitKind;
  /** Stored in challenges.forfeit_text when kind is custom. */
  text: string | null;
};

export type ForfeitSelection = {
  kind: ForfeitKind;
  text: string | null;
};

export const FORFEIT_PRESET_CATEGORIES: {
  id: ForfeitPresetCategory;
  label: string;
}[] = [
  { id: "drink", label: "Drinks" },
  { id: "food", label: "Food" },
  { id: "money", label: "Money" },
  { id: "classic", label: "Classic" },
];

export const FORFEIT_PRESETS: ForfeitPreset[] = [
  { id: "beer", category: "drink", label: "A beer", kind: "custom", text: "a beer" },
  {
    id: "round",
    category: "drink",
    label: "Round of drinks",
    kind: "custom",
    text: "a round of drinks",
  },
  { id: "coffee", category: "drink", label: "Coffee", kind: "custom", text: "coffee" },
  { id: "wings", category: "food", label: "Wings", kind: "custom", text: "wings" },
  { id: "pizza", category: "food", label: "Pizza", kind: "custom", text: "pizza" },
  { id: "dinner", category: "food", label: "Dinner", kind: "custom", text: "dinner" },
  {
    id: "garlic_bread",
    category: "food",
    label: "Garlic Bread",
    kind: "custom",
    text: "garlic bread",
  },
  {
    id: "banana_bread",
    category: "food",
    label: "Banana Bread",
    kind: "custom",
    text: "banana bread",
  },
  { id: "money_5", category: "money", label: "$5", kind: "custom", text: "$5" },
  { id: "money_10", category: "money", label: "$10", kind: "custom", text: "$10" },
  { id: "money_20", category: "money", label: "$20", kind: "custom", text: "$20" },
  {
    id: "concession",
    category: "classic",
    label: "Concession card",
    kind: "concession",
    text: null,
  },
  {
    id: "jersey_swap",
    category: "classic",
    label: "Jersey swap",
    kind: "jersey_swap",
    text: null,
  },
];

export function presetToSelection(preset: ForfeitPreset): ForfeitSelection {
  return { kind: preset.kind, text: preset.text };
}

export function findPresetById(id: string): ForfeitPreset | undefined {
  return FORFEIT_PRESETS.find((preset) => preset.id === id);
}
