/** PostgREST `.or()` filter for the create-game picker. */
export function buildCreateGamesOrFilter(from: Date, to: Date): string {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return `and(status.eq.live,starts_at.lte.${toIso}),and(status.eq.scheduled,starts_at.gte.${fromIso},starts_at.lte.${toIso})`;
}

/** Whether a stored game row belongs in the create picker window. */
export function isGameInCreateList(
  game: { status: string; startsAt: Date },
  from: Date,
  to: Date,
): boolean {
  if (game.status === "live") {
    return game.startsAt <= to;
  }
  if (game.status === "scheduled") {
    return game.startsAt >= from && game.startsAt <= to;
  }
  return false;
}
