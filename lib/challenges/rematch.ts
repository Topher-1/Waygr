import type { CreateChallengeInput } from "@/lib/challenges/create";
import { defaultLine } from "@/lib/challenges/create";

export type RematchSource = {
  id: string;
  market: CreateChallengeInput["market"];
  creatorPick: CreateChallengeInput["creatorPick"];
  line: number | null;
  quarter: number | null;
  forfeitKind: CreateChallengeInput["forfeitKind"];
  forfeitText: string | null;
  game: {
    homeTeam: string;
    awayTeam: string;
    startsAt: string;
  };
};

export type GameCandidate = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  status: string;
};

export type RematchPrefill = CreateChallengeInput & {
  rematchOf: string;
};

export type RematchRejectReason =
  | "unauthorized"
  | "not_found"
  | "not_participant"
  | "no_next_game";

/** Find the next scheduled game featuring either team after the source game. */
export function findNextGameForRematch(
  source: RematchSource,
  candidates: GameCandidate[],
  now: Date,
): GameCandidate | null {
  const teamCodes = new Set([source.game.homeTeam, source.game.awayTeam]);
  const sourceStart = new Date(source.game.startsAt).getTime();

  const eligible = candidates
    .filter((g) => {
      if (g.status !== "scheduled") return false;
      if (new Date(g.startsAt) <= now) return false;
      if (new Date(g.startsAt).getTime() <= sourceStart) return false;
      return teamCodes.has(g.homeTeam) || teamCodes.has(g.awayTeam);
    })
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

  return eligible[0] ?? null;
}

/** Clone market/forfeit onto the next game (unit-tested shape). */
export function buildRematchPrefill(
  source: RematchSource,
  nextGame: GameCandidate,
): RematchPrefill {
  const line =
    source.line ??
    (source.market === "spread" || source.market === "total"
      ? defaultLine(source.market)
      : null);

  return {
    gameId: nextGame.id,
    market: source.market,
    creatorPick: source.creatorPick,
    line,
    quarter: source.quarter,
    forfeitKind: source.forfeitKind,
    forfeitText: source.forfeitText,
    rematchOf: source.id,
  };
}
