/**
 * Brand tokens — sole source of truth for palette values.
 * CSS vars in styles/tokens.css must match these exactly.
 * @see docs/BRAND-BRIEF.md
 */
export const tokens = {
  dark: {
    bg: "#0B0B0D",
    surface: "#16161A",
    raised: "#202026",
    border: "#2E2E36",
    text: "#F5F3EF",
    muted: "#A1A1AA",
    orange: "#FF5F1F",
    orangeStrong: "#FF5F1F",
    blue: "#4D8DFF",
    green: "#34D17D",
    rose: "#FF4D6D",
    onAccent: "#0B0B0D",
  },
  light: {
    bg: "#FAFAF7",
    surface: "#FFFFFF",
    raised: "#F1F0EC",
    border: "#E2E0DA",
    text: "#121214",
    muted: "#5E5E66",
    orange: "#FF5F1F",
    orangeStrong: "#C2410C",
    blue: "#2563EB",
    green: "#166534",
    rose: "#BE123C",
    onAccent: "#0B0B0D",
  },
} as const;

export type ThemeMode = keyof typeof tokens;
export type TokenName = keyof (typeof tokens)["dark"];

/** Flat set of every allowed hex color in the design system. */
export const allowedColors = new Set<string>([
  ...Object.values(tokens.dark),
  ...Object.values(tokens.light),
]);

/** CSS custom-property names that must exist in tokens.css */
export const requiredCssVars = [
  "--bg",
  "--surface",
  "--raised",
  "--border",
  "--text",
  "--muted",
  "--orange",
  "--orange-strong",
  "--blue",
  "--green",
  "--rose",
  "--on-accent",
] as const;
