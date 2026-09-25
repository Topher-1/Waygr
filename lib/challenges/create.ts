import { screenCustomForfeit } from "@/lib/forfeit-screen";
import { isGameOpenable } from "@/lib/games/openable";

export type Market = "winner" | "spread" | "total" | "half_leader" | "quarter_winner";
export type Pick = "home" | "away" | "over" | "under";
export type ForfeitKind = "concession" | "jersey_swap" | "custom";

export type CreateChallengeInput = {
  gameId: string;
  market: Market;
  creatorPick: Pick;
  line?: number | null;
  quarter?: number | null;
  forfeitKind: ForfeitKind;
  forfeitText?: string | null;
  rematchOf?: string | null;
};

export type CreateRejectReason =
  | "unauthorized"
  | "adult_required"
  | "game_over"
  | "invalid_market"
  | "invalid_pick"
  | "line_required"
  | "quarter_required"
  | "forfeit_text_required"
  | "invalid_forfeit_kind"
  | "forfeit_screened"
  | "game_not_found";

export type CreateValidationContext = {
  gameStatus: string;
  adultConfirmedAt: Date | null;
};

export type CreateValidationResult =
  | { ok: true; payload: CreateChallengeInput }
  | { ok: false; reason: CreateRejectReason };

function isMarket(value: string): value is Market {
  return ["winner", "spread", "total", "half_leader", "quarter_winner"].includes(value);
}

function isPick(value: string): value is Pick {
  return ["home", "away", "over", "under"].includes(value);
}

function isForfeitKind(value: string): value is ForfeitKind {
  return ["concession", "jersey_swap", "custom"].includes(value);
}

/** Pre-flight checks before inserting a challenge (unit-tested). */
export function validateCreate(
  body: Record<string, unknown>,
  context: CreateValidationContext,
): CreateValidationResult {
  if (!context.adultConfirmedAt) {
    return { ok: false, reason: "adult_required" };
  }

  if (!isGameOpenable(context.gameStatus)) {
    return { ok: false, reason: "game_over" };
  }

  const gameId = typeof body.gameId === "string" ? body.gameId : "";
  const market = typeof body.market === "string" ? body.market : "";
  const creatorPick = typeof body.creatorPick === "string" ? body.creatorPick : "";
  const forfeitKind = typeof body.forfeitKind === "string" ? body.forfeitKind : "";

  if (!gameId) {
    return { ok: false, reason: "game_not_found" };
  }
  if (!isMarket(market)) {
    return { ok: false, reason: "invalid_market" };
  }
  if (!isPick(creatorPick)) {
    return { ok: false, reason: "invalid_pick" };
  }
  if (!isForfeitKind(forfeitKind)) {
    return { ok: false, reason: "invalid_forfeit_kind" };
  }

  const line =
    body.line === null || body.line === undefined
      ? null
      : typeof body.line === "number"
        ? body.line
        : Number(body.line);

  const quarter =
    body.quarter === null || body.quarter === undefined
      ? null
      : typeof body.quarter === "number"
        ? body.quarter
        : Number(body.quarter);

  if (market === "spread" || market === "total") {
    if (line === null || !Number.isFinite(line)) {
      return { ok: false, reason: "line_required" };
    }
  } else if (line !== null && !Number.isFinite(line)) {
    return { ok: false, reason: "line_required" };
  }

  if (market === "quarter_winner") {
    if (quarter === null || !Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
      return { ok: false, reason: "quarter_required" };
    }
  }

  if (
    market === "winner" ||
    market === "half_leader" ||
    market === "spread" ||
    market === "quarter_winner"
  ) {
    if (creatorPick !== "home" && creatorPick !== "away") {
      return { ok: false, reason: "invalid_pick" };
    }
  }
  if (market === "total") {
    if (creatorPick !== "over" && creatorPick !== "under") {
      return { ok: false, reason: "invalid_pick" };
    }
  }

  let forfeitText: string | null = null;
  if (forfeitKind === "custom") {
    const raw = typeof body.forfeitText === "string" ? body.forfeitText : "";
    const screened = screenCustomForfeit(raw);
    if (!screened.ok) {
      return { ok: false, reason: "forfeit_screened" };
    }
    forfeitText = raw.trim();
  }

  const rematchOf =
    typeof body.rematchOf === "string" && body.rematchOf.length > 0
      ? body.rematchOf
      : null;

  return {
    ok: true,
    payload: {
      gameId,
      market,
      creatorPick,
      line: line ?? null,
      quarter: market === "quarter_winner" ? quarter : null,
      forfeitKind,
      forfeitText,
      rematchOf,
    },
  };
}

/** Default line for spread/total steppers. */
export function defaultLine(market: Market): number {
  return market === "total" ? 47.5 : -3.5;
}

/** Step line by 0.5 in the given direction. */
export function stepLine(line: number, direction: "up" | "down"): number {
  const delta = direction === "up" ? 0.5 : -0.5;
  const next = Math.round((line + delta) * 2) / 2;
  return next;
}
