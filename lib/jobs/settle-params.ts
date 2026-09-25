import type { Outcome } from '@/lib/settle.ts';
import type { AtomicSettleParams, ChallengeRow, GameRow } from '@/lib/jobs/types.ts';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function invertPick(pick: ChallengeRow['creatorPick']): 'home' | 'away' {
  if (pick === 'home') return 'away';
  if (pick === 'away') return 'home';
  return 'home';
}

export function buildAtomicSettleParams(
  challenge: ChallengeRow,
  game: GameRow,
  outcome: Outcome,
  settledAt: string,
  getTeamAbbr: (teamCode: string) => string | Promise<string>,
): Promise<AtomicSettleParams> | AtomicSettleParams {
  const base: AtomicSettleParams = {
    challengeId: challenge.id,
    outcome,
    settledAt,
    owedBy: null,
    owedTo: null,
    forfeitKind: null,
    jerseyTeam: null,
    jerseyUntil: null,
  };

  if (outcome === 'push') return base;

  const winnerId = outcome === 'creator' ? challenge.creatorId : challenge.opponentId!;
  const loserId = outcome === 'creator' ? challenge.opponentId! : challenge.creatorId;
  const dueAt = new Date(new Date(settledAt).getTime() + SEVEN_DAYS_MS).toISOString();

  const params: AtomicSettleParams = {
    ...base,
    owedBy: loserId,
    owedTo: winnerId,
    forfeitKind: challenge.forfeitKind,
    jerseyTeam: null,
    jerseyUntil: dueAt,
  };

  if (challenge.forfeitKind !== 'jersey_swap') {
    return params;
  }

  const loserPick = outcome === 'creator' ? challenge.creatorPick : invertPick(challenge.creatorPick);
  const teamCode = loserPick === 'home' ? game.homeTeam : game.awayTeam;
  const abbrPromise = Promise.resolve(getTeamAbbr(teamCode));

  return abbrPromise.then((abbr) => ({
    ...params,
    jerseyTeam: abbr,
    jerseyUntil: dueAt,
  }));
}
