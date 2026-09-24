import type { ChallengeLanding } from "@/lib/challenges/types";

function teamName(
  challenge: ChallengeLanding,
  side: "home" | "away",
): string {
  return side === "home"
    ? challenge.game.homeTeam.name
    : challenge.game.awayTeam.name;
}

function teamAbbr(
  challenge: ChallengeLanding,
  side: "home" | "away",
): string {
  return side === "home"
    ? challenge.game.homeTeam.abbr
    : challenge.game.awayTeam.abbr;
}

/** Human-readable call line for previews and OG. */
export function formatCall(challenge: ChallengeLanding): string {
  const pick = challenge.creatorPick;
  const line = challenge.line ? parseFloat(challenge.line) : null;

  switch (challenge.market) {
    case "winner":
      return `${teamName(challenge, pick as "home" | "away")} to win`;
    case "spread": {
      const abbr = teamAbbr(challenge, pick as "home" | "away");
      const sign = line !== null && line > 0 ? "+" : "";
      return `${abbr} ${sign}${line}`;
    }
    case "total":
      return `${pick === "over" ? "Over" : "Under"} ${line}`;
    case "half_leader":
      return `${teamName(challenge, pick as "home" | "away")} lead at half`;
    case "quarter_winner": {
      const abbr = teamAbbr(challenge, pick as "home" | "away");
      return `${abbr} win Q${challenge.quarter ?? "?"}`;
    }
    default:
      return "a call";
  }
}

/** Forfeit line for previews. */
export function formatForfeit(challenge: ChallengeLanding): string {
  switch (challenge.forfeitKind) {
    case "concession":
      return "posts a concession card";
    case "jersey_swap":
      return "wears the other team's colors for a week";
    case "custom":
      return challenge.forfeitText
        ? `owes ${challenge.forfeitText}`
        : "owes a custom forfeit";
    default:
      return "owes a forfeit";
  }
}

/** Short matchup label, e.g. "KC at BUF". */
export function formatMatchup(challenge: ChallengeLanding): string {
  const { homeTeam, awayTeam } = challenge.game;
  return `${awayTeam.abbr} at ${homeTeam.abbr}`;
}

/** Kickoff in viewer-local short form (SSR uses UTC; client can reformat). */
export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
