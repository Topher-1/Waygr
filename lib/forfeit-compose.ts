import type { ForfeitKind } from "@/lib/challenges/create";
import { findPresetById } from "@/lib/forfeit-presets";

export type ForfeitComposeInput = {
  presetIds: string[];
  customText?: string | null;
};

export type ComposedForfeit = {
  kind: ForfeitKind;
  text: string | null;
  /** Chip-style stake line for confirm UI, e.g. "A beer + $10". */
  displayStake: string;
};

function classicStorageText(kind: ForfeitKind): string {
  if (kind === "concession") return "a concession card";
  if (kind === "jersey_swap") return "a jersey swap";
  return "a forfeit";
}

function presetPart(presetId: string): {
  kind: ForfeitKind;
  text: string | null;
  label: string;
} | null {
  const preset = findPresetById(presetId);
  if (!preset) return null;
  return {
    kind: preset.kind,
    text: preset.text,
    label: preset.label,
  };
}

/** Compose multi-select presets (+ optional custom) into one stored forfeit. */
export function composeForfeit(input: ForfeitComposeInput): ComposedForfeit | null {
  const parts: { kind: ForfeitKind; text: string | null; label: string }[] = [];

  for (const presetId of input.presetIds) {
    const part = presetPart(presetId);
    if (part) parts.push(part);
  }

  const custom = input.customText?.trim();
  if (custom) {
    parts.push({ kind: "custom", text: custom, label: custom });
  }

  if (parts.length === 0) return null;

  if (parts.length === 1 && parts[0].kind !== "custom") {
    const only = parts[0];
    return {
      kind: only.kind,
      text: only.text,
      displayStake: only.label,
    };
  }

  const displayStake = parts.map((part) => part.label).join(" + ");
  const storageText = parts
    .map((part) => part.text ?? classicStorageText(part.kind))
    .join(" + ");

  return {
    kind: "custom",
    text: storageText,
    displayStake,
  };
}
