/**
 * Result card content (BUILD-BRIEF · `GET /api/cards/[slug]`).
 * Pure: turns a settled challenge into the lines the brand card templates draw,
 * so the route handler only does layout.
 * @see docs/brand/template-result-card-1080x1350.svg
 * @see docs/brand/template-story-card-1080x1920.svg
 */
import { copy } from "@/lib/copy";
import {
  formatCallForSide,
  formatForfeit,
  formatMatchup,
} from "@/lib/challenges/format";
import type { ChallengeLanding } from "@/lib/challenges/types";

export const CARD_TYPES = ["called", "concession", "proof"] as const;
export const CARD_FORMATS = ["post", "story"] as const;

export type CardType = (typeof CARD_TYPES)[number];
export type CardFormat = (typeof CARD_FORMATS)[number];

/** Post = 1080×1350, story = 1080×1920 (BUILD). */
export const CARD_SIZES: Record<CardFormat, { width: number; height: number }> = {
  post: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

export function parseCardType(value: string | null): CardType {
  return CARD_TYPES.includes(value as CardType) ? (value as CardType) : "called";
}

export function parseCardFormat(value: string | null): CardFormat {
  return CARD_FORMATS.includes(value as CardFormat)
    ? (value as CardFormat)
    : "post";
}

export type CardContent = {
  type: CardType;
  format: CardFormat;
  /** Small all-caps line above the headline. */
  scoreLine: string;
  headline: string;
  /** Whose avatar sits under the headline — always the person sharing. */
  subjectName: string;
  subjectInitial: string;
  subjectCall: string;
  forfeitLine: string | null;
  rivalryLine: string | null;
  footer: string;
};

function initial(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

function scoreLine(challenge: ChallengeLanding): string {
  const { game } = challenge;
  const status = game.status === "final" ? copy.cards.final : copy.cards.live;
  return `${game.awayTeam.name} ${game.awayScore} · ${game.homeTeam.name} ${game.homeScore} · ${status}`.toUpperCase();
}

export type CardRivalry = { wins: number; losses: number } | null;

/**
 * Build the card. `called` is the winner's card; `concession` and `proof` are
 * the loser's, so the subject (orange side) changes with the type.
 */
export function buildCardContent(
  challenge: ChallengeLanding,
  type: CardType,
  format: CardFormat,
  rivalry: CardRivalry = null,
): CardContent {
  const creatorWon = challenge.outcome === "creator";
  const winner = creatorWon ? challenge.creator : challenge.opponent;
  const loser = creatorWon ? challenge.opponent : challenge.creator;
  const winnerSide: "creator" | "opponent" = creatorWon ? "creator" : "opponent";
  const loserSide: "creator" | "opponent" = creatorWon ? "opponent" : "creator";
  const forfeit = formatForfeit(challenge);

  if (challenge.outcome === "push" || !winner || !loser) {
    return {
      type,
      format,
      scoreLine: scoreLine(challenge),
      headline: copy.result.push,
      subjectName: challenge.creator.displayName,
      subjectInitial: initial(challenge.creator.displayName),
      subjectCall: formatCallForSide(challenge, "creator"),
      forfeitLine: null,
      rivalryLine: rivalryLine(challenge, rivalry),
      footer: copy.cards.footer,
    };
  }

  if (type === "called") {
    return {
      type,
      format,
      scoreLine: scoreLine(challenge),
      headline: copy.cards.calledHeadline,
      subjectName: winner.displayName,
      subjectInitial: initial(winner.displayName),
      subjectCall: formatCallForSide(challenge, winnerSide),
      forfeitLine: copy.cards.owesLine(
        loser.displayName,
        winner.displayName,
        forfeit,
      ),
      rivalryLine: rivalryLine(challenge, rivalry),
      footer: copy.cards.footer,
    };
  }

  const headline =
    type === "proof"
      ? copy.cards.proofHeadline
      : copy.cards.concessionHeadline(winner.displayName);

  return {
    type,
    format,
    scoreLine: scoreLine(challenge),
    headline,
    subjectName: loser.displayName,
    subjectInitial: initial(loser.displayName),
    subjectCall: formatCallForSide(challenge, loserSide),
    forfeitLine:
      type === "proof"
        ? copy.cards.paidLine(loser.displayName, winner.displayName, forfeit)
        : copy.cards.owesLine(
            loser.displayName,
            winner.displayName,
            forfeit,
          ),
    rivalryLine: rivalryLine(challenge, rivalry),
    footer: copy.cards.footer,
  };
}

function rivalryLine(
  challenge: ChallengeLanding,
  rivalry: CardRivalry,
): string | null {
  if (!rivalry || !challenge.opponent) return null;
  const creatorWon = challenge.outcome === "creator";
  const winner = creatorWon ? challenge.creator : challenge.opponent;
  const loser = creatorWon ? challenge.opponent : challenge.creator;
  if (rivalry.wins === rivalry.losses) {
    return copy.cards.rivalryEven(
      winner.displayName,
      loser.displayName,
      rivalry.wins,
    );
  }
  const leaderFirst = rivalry.wins > rivalry.losses;
  return copy.cards.rivalryLead(
    leaderFirst ? winner.displayName : loser.displayName,
    leaderFirst ? loser.displayName : winner.displayName,
    Math.max(rivalry.wins, rivalry.losses),
    Math.min(rivalry.wins, rivalry.losses),
  );
}

/** Filename for the download fallback on desktop. */
export function cardFileName(
  slug: string,
  type: CardType,
  format: CardFormat,
): string {
  return `waygr-${type}-${format}-${slug}.png`;
}

/** Share card URL for a slug (relative; the client resolves the origin). */
export function cardPath(
  slug: string,
  type: CardType,
  format: CardFormat,
): string {
  return `/api/cards/${slug}?type=${type}&format=${format}`;
}

/** Matchup label reused by the card alt text. */
export function cardAlt(challenge: ChallengeLanding, type: CardType): string {
  return `${formatMatchup(challenge)} — ${type}`;
}
