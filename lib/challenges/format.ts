import type { ChallengeLanding } from "@/lib/challenges/types";
import { APP_TIMEZONE } from "@/lib/constants";

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

/**
 * The same call from the other side: the opponent always holds the opposite pick,
 * and for a spread the mirrored line (BUILD · Definitions).
 */
export function formatCallForSide(
  challenge: ChallengeLanding,
  side: "creator" | "opponent",
): string {
  if (side === "creator") {
    return formatCall(challenge);
  }

  const inverted: ChallengeLanding = {
    ...challenge,
    creatorPick:
      challenge.creatorPick === "home"
        ? "away"
        : challenge.creatorPick === "away"
          ? "home"
          : challenge.creatorPick === "over"
            ? "under"
            : "over",
    line:
      challenge.market === "spread" && challenge.line !== null
        ? String(-parseFloat(challenge.line))
        : challenge.line,
  };

  return formatCall(inverted);
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

/**
 * Characters that fit the OG eyebrow at ~40px inside the 1200px card
 * with side padding. Longer lines are shortened in JS so Satori never
 * clips a glyph.
 */
const OG_MATCHUP_MAX = 32;

type OgTeam = { abbr: string; name: string };

function readableOgSide(team: OgTeam): string {
  const abbr = team.abbr.trim();
  const name = team.name.trim();
  if (!name || name.toUpperCase() === abbr.toUpperCase()) return abbr;
  return name;
}

/** Collapse whitespace and end with an ellipsis once `max` is exceeded. */
export function clampOgText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  if (max <= 1) return "…";
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function clampOgSide(side: string, max: number): string {
  if (side.length <= max) return side;
  return clampOgText(side, max);
}

/** Keep both sides visible: `AWAY @ HOME`, ellipsis on the long side. */
function clampOgMatchup(away: string, home: string, max: number): string {
  const sep = " @ ";
  const line = `${away}${sep}${home}`;
  if (line.length <= max) return line;
  const budget = Math.max(3, max - sep.length);
  let awayMax = Math.floor(budget / 2);
  let homeMax = budget - awayMax;
  if (away.length < awayMax) {
    homeMax += awayMax - away.length;
    awayMax = away.length;
  } else if (home.length < homeMax) {
    awayMax += homeMax - home.length;
    homeMax = home.length;
  }
  return `${clampOgSide(away, awayMax)}${sep}${clampOgSide(home, homeMax)}`;
}

/**
 * Link-preview matchup. Nicknames ("Panthers @ Browns") because a 3-letter
 * code like CAR reads as a clipped word in the iMessage bubble.
 * Abbreviations are the fallback when the nickname line would overflow.
 */
export function formatOgMatchup(challenge: ChallengeLanding): string {
  const { homeTeam, awayTeam } = challenge.game;
  const named = `${readableOgSide(awayTeam)} @ ${readableOgSide(homeTeam)}`;
  if (named.length <= OG_MATCHUP_MAX) return named.toUpperCase();
  const coded = `${awayTeam.abbr.trim()} @ ${homeTeam.abbr.trim()}`;
  if (coded.length <= OG_MATCHUP_MAX) return coded.toUpperCase();
  return clampOgMatchup(
    awayTeam.abbr.trim(),
    homeTeam.abbr.trim(),
    OG_MATCHUP_MAX,
  ).toUpperCase();
}

/** Kickoff in app display timezone (America/Chicago). */
export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
