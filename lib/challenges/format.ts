import type { ChallengeLanding } from "@/lib/challenges/types";

export type CallFormatInput = {
  market: string;
  creatorPick: string;
  line: number | string | null;
  quarter: number | null;
  game: {
    homeTeam: { abbr: string; name: string };
    awayTeam: { abbr: string; name: string };
  };
};

function teamAbbr(input: CallFormatInput, side: "home" | "away"): string {
  return side === "home" ? input.game.homeTeam.abbr : input.game.awayTeam.abbr;
}

function parseLine(line: number | string | null): number | null {
  if (line === null || line === undefined) return null;
  const value = typeof line === "number" ? line : parseFloat(line);
  return Number.isFinite(value) ? value : null;
}

/** Human-readable call line using team abbrs (create preview, OG, challenge pages). */
export function formatCallFromParts(input: CallFormatInput): string {
  const pick = input.creatorPick;
  const line = parseLine(input.line);

  switch (input.market) {
    case "winner":
      return `${teamAbbr(input, pick as "home" | "away")} wins`;
    case "spread": {
      const abbr = teamAbbr(input, pick as "home" | "away");
      const sign = line !== null && line > 0 ? "+" : "";
      return `${abbr} ${sign}${line}`;
    }
    case "total":
      return `${pick === "over" ? "Over" : "Under"} ${line}`;
    case "half_leader":
      return `${teamAbbr(input, pick as "home" | "away")} leads at half`;
    case "quarter_winner": {
      const abbr = teamAbbr(input, pick as "home" | "away");
      return `${abbr} wins Q${input.quarter ?? "?"}`;
    }
    default:
      return "a call";
  }
}

/** Human-readable call line for previews and OG. */
export function formatCall(challenge: ChallengeLanding): string {
  return formatCallFromParts({
    market: challenge.market,
    creatorPick: challenge.creatorPick,
    line: challenge.line,
    quarter: challenge.quarter,
    game: challenge.game,
  });
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

/** Stake line for confirm UI — omits the "owes" prefix. */
export function formatStakeDisplay(challenge: ChallengeLanding): string {
  switch (challenge.forfeitKind) {
    case "concession":
      return "Concession card";
    case "jersey_swap":
      return "Jersey swap";
    case "custom":
      return challenge.forfeitText ?? "Custom forfeit";
    default:
      return "Forfeit";
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
