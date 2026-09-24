/**
 * Screens custom forfeit text before create.
 * Drinks, food, and honor-system money are allowed.
 * Payment rails / deep links and dangerous terms are blocked.
 */

const PAYMENT_RAIL_PATTERNS: RegExp[] = [
  /\b(stripe|paypal|square\s*cash|cash\s*app\s*pay|apple\s*pay|google\s*pay|zelle)\b/i,
  /\b(venmo\.com|cash\.app|paypal\.me|zellepay\.com|stripe\.com)\b/i,
  /https?:\/\/\S*(venmo|cash\.app|paypal|zelle|stripe)\S*/i,
  /\b(oauth|checkout|escrow|wallet\s*link|payment\s*link)\b/i,
];

const DANGEROUS_PATTERNS: RegExp[] = [
  /\b(kill|murder|suicide|self[\s-]?harm|rape|assault)\b/i,
  /\b(punch|fight|beat\s+up|injure|hurt\s+(yourself|them))\b/i,
  /\b(nude|naked|strip\s+down|sexual)\b/i,
];

export const CUSTOM_FORFEIT_MAX_LENGTH = 80;

export type ForfeitScreenResult =
  | { ok: true }
  | { ok: false; reason: "payment_rail" | "dangerous" | "empty" | "too_long" };

/** Screen custom forfeit text before write. */
export function screenCustomForfeit(text: string): ForfeitScreenResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }
  if (trimmed.length > CUSTOM_FORFEIT_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }
  if (PAYMENT_RAIL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { ok: false, reason: "payment_rail" };
  }
  if (DANGEROUS_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { ok: false, reason: "dangerous" };
  }
  return { ok: true };
}
