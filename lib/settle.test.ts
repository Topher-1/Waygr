import { describe, expect, it } from 'vitest';
import { settle, type Game, type Challenge } from './settle';
const ps = (...q: [number, number][]) => q.map(([home, away], i) => ({ period: i + 1, home, away }));
const nfl = (status: Game['status'], period: number | null, q: [number, number][]): Game => {
  const periodScores = ps(...q);
  return { league: 'nfl', status, period, periodScores,
    homeScore: periodScores.reduce((a, s) => a + s.home, 0), awayScore: periodScores.reduce((a, s) => a + s.away, 0) };
};
const final = nfl('final', 4, [[7, 3], [10, 7], [3, 7], [7, 3]]); // KC(home) 27, BUF 20
const c = (market: Challenge['market'], creatorPick: Challenge['creatorPick'], line: number | null = null, quarter: number | null = null): Challenge => ({ market, creatorPick, line, quarter });
const cases: [string, Challenge, Game, ReturnType<typeof settle>][] = [
  ['winner home wins', c('winner', 'home'), final, 'creator'],
  ['winner away loses', c('winner', 'away'), final, 'opponent'],
  ['winner not final', c('winner', 'home'), nfl('live', 3, [[7, 3], [10, 7], [3, 7]]), null],
  ['winner NFL tie is push', c('winner', 'home'), nfl('final', 5, [[7, 7], [3, 3], [0, 0], [7, 7], [0, 0]]), 'push'],
  ['spread KC -3.5 covers by 7', c('spread', 'home', -3.5), final, 'creator'],
  ['spread KC -7 pushes', c('spread', 'home', -7), final, 'push'],
  ['spread KC -7.5 fails', c('spread', 'home', -7.5), final, 'opponent'],
  ['spread BUF +7.5 covers', c('spread', 'away', 7.5), final, 'creator'],
  ['spread BUF +6.5 fails', c('spread', 'away', 6.5), final, 'opponent'],
  ['total over 46.5 hits (47)', c('total', 'over', 46.5), final, 'creator'],
  ['total under 46.5 misses', c('total', 'under', 46.5), final, 'opponent'],
  ['total 47 pushes', c('total', 'over', 47), final, 'push'],
  ['total counts OT', c('total', 'over', 40.5), nfl('final', 5, [[7, 7], [10, 10], [0, 0], [3, 3], [6, 0]]), 'creator'],
  ['half leader home 17-10', c('half_leader', 'home'), final, 'creator'],
  ['half leader decided during Q3', c('half_leader', 'away'), nfl('live', 3, [[7, 3], [10, 7]]), 'opponent'],
  ['half leader not yet in Q2', c('half_leader', 'home'), nfl('live', 2, [[7, 3], [3, 0]]), null],
  ['half tie push', c('half_leader', 'home'), nfl('live', 3, [[7, 7], [3, 3]]), 'push'],
  ['Q3 away wins 7-3', c('quarter_winner', 'away', null, 3), final, 'creator'],
  ['Q3 still live', c('quarter_winner', 'away', null, 3), nfl('live', 3, [[7, 3], [10, 7], [0, 7]]), null],
  ['Q1 decided once Q2 starts', c('quarter_winner', 'home', null, 1), nfl('live', 2, [[7, 3], [0, 0]]), 'creator'],
  ['quarter tie push', c('quarter_winner', 'home', null, 2), nfl('live', 3, [[7, 3], [3, 3]]), 'push'],
  ['ncaab half = period 1', c('half_leader', 'home'), { league: 'ncaab', status: 'live', period: 2, homeScore: 40, awayScore: 35, periodScores: [{ period: 1, home: 38, away: 30 }, { period: 2, home: 2, away: 5 }] }, 'creator'],
  ['ncaab has no quarters', c('quarter_winner', 'home', null, 1), { league: 'ncaab', status: 'final', period: 2, homeScore: 70, awayScore: 60, periodScores: [{ period: 1, home: 38, away: 30 }, { period: 2, home: 32, away: 30 }] }, null],
  ['postponed never settles', c('winner', 'home'), { ...final, status: 'postponed' }, null],
];
describe('settle()', () => {
  it.each(cases)('%s', (_name, challenge, game, want) => {
    expect(settle(challenge, game)).toBe(want);
  });
});
