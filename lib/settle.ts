export type Market = 'winner' | 'spread' | 'total' | 'half_leader' | 'quarter_winner';
export type Pick = 'home' | 'away' | 'over' | 'under';
export type Outcome = 'creator' | 'opponent' | 'push';
export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed' | 'suspended' | 'canceled';

export interface Game {
  league: 'nfl' | 'ncaaf' | 'nba' | 'ncaab';
  status: GameStatus;
  period: number | null; // current period; for a final game, the last period played
  homeScore: number;
  awayScore: number;
  periodScores: { period: number; home: number; away: number }[]; // 5+ = overtime
}

export interface Challenge {
  market: Market;
  creatorPick: Pick;
  line: number | null; // spread from the creator's team, or the total
  quarter: number | null; // 1-4 for quarter_winner
}

/** Pure. Returns the result, or null while it can't be decided yet. Void is handled by the caller. */
export function settle(c: Challenge, g: Game): Outcome | null {
  const final = g.status === 'final';
  const side = (home: number, away: number): Outcome => {
    if (home === away) return 'push';
    const homeAhead = home > away;
    return (c.creatorPick === 'home') === homeAhead ? 'creator' : 'opponent';
  };
  // Is period p complete? True once the game is final or play has moved past it.
  const periodDone = (p: number) => final || (g.status === 'live' && (g.period ?? 0) > p);
  const scoreThrough = (last: number) =>
    g.periodScores
      .filter((s) => s.period <= last)
      .reduce((a, s) => ({ home: a.home + s.home, away: a.away + s.away }), { home: 0, away: 0 });
  const halfEnds = g.league === 'ncaab' ? 1 : 2; // men's college hoops plays two halves
  switch (c.market) {
    case 'winner':
      return final ? side(g.homeScore, g.awayScore) : null;
    case 'spread': {
      if (!final || c.line === null) return null;
      const mine = c.creatorPick === 'home' ? g.homeScore : g.awayScore;
      const theirs = c.creatorPick === 'home' ? g.awayScore : g.homeScore;
      const margin = mine + c.line - theirs;
      return margin === 0 ? 'push' : margin > 0 ? 'creator' : 'opponent';
    }
    case 'total': {
      if (!final || c.line === null) return null;
      const total = g.homeScore + g.awayScore;
      if (total === c.line) return 'push';
      return (c.creatorPick === 'over') === (total > c.line) ? 'creator' : 'opponent';
    }
    case 'half_leader': {
      if (!periodDone(halfEnds)) return null;
      const h = scoreThrough(halfEnds);
      return side(h.home, h.away);
    }
    case 'quarter_winner': {
      if (c.quarter === null || g.league === 'ncaab' || !periodDone(c.quarter)) return null;
      const q = g.periodScores.find((s) => s.period === c.quarter);
      return q ? side(q.home, q.away) : null;
    }
  }
}
