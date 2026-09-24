/** Banned terms for custom forfeits (BUILD · Custom forfeit screening). */
const BANNED_PATTERNS = [
  /\balcohol\b/i,
  /\bdrink(?:ing)?\b/i,
  /\bbeers?\b/i,
  /\bwine\b/i,
  /\bliquor\b/i,
  /\bshot(?:s)?\b/i,
  /\bwhiskey\b/i,
  /\bvodka\b/i,
  /\btequila\b/i,
  /\bmoney\b/i,
  /\bcash\b/i,
  /\bdollar(?:s)?\b/i,
  /\bpay(?:ment)?\b/i,
  /\bvenmo\b/i,
  /\bzelle\b/i,
  /\bcashapp\b/i,
  /\bpaypal\b/i,
  /\bbuy\s+drinks\b/i,
  /\bwings\b/i,
  /\bstrip\b/i,
  /\bnude\b/i,
  /\bfight\b/i,
  /\bweapon\b/i,
];

export const CUSTOM_FORFEIT_MAX_LENGTH = 80;

export type ForfeitScreenResult =
  | { ok: true }
  | { ok: false; reason: "too_long" | "empty" | "banned" };

/** Screen custom forfeit text before write. */
export function screenCustomForfeit(text: string): ForfeitScreenResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }
  if (trimmed.length > CUSTOM_FORFEIT_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: "banned" };
    }
  }
  return { ok: true };
}
