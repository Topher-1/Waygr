import type { ChallengeLanding, ChallengeView } from "@/lib/challenges/types";
import { tokens } from "@/lib/theme";

/** Demo uses brand tokens only (theme-tokens test). Real team colors come from DB. */
const teams = {
  home: {
    code: "nfl:KC",
    abbr: "KC",
    name: "Chiefs",
    primaryColor: tokens.dark.orange,
    secondaryColor: tokens.dark.onAccent,
  },
  away: {
    code: "nfl:BUF",
    abbr: "BUF",
    name: "Bills",
    primaryColor: tokens.dark.blue,
    secondaryColor: tokens.dark.onAccent,
  },
};

const futureKickoff = new Date(Date.now() + 4 * 3600_000).toISOString();

const base: ChallengeLanding = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "demo",
  market: "spread",
  creatorPick: "home",
  line: "-3.5",
  quarter: null,
  forfeitKind: "jersey_swap",
  forfeitText: null,
  outcome: null,
  acceptedAt: null,
  settledAt: null,
  state: "open",
  creator: {
    id: "00000000-0000-0000-0000-000000000010",
    handle: "sam",
    displayName: "Sam",
    avatarUrl: null,
  },
  opponent: null,
  game: {
    id: "00000000-0000-0000-0000-000000000020",
    league: "nfl",
    startsAt: futureKickoff,
    status: "scheduled",
    period: null,
    clock: null,
    homeScore: 0,
    awayScore: 0,
    periodScores: [],
    updatedAt: new Date().toISOString(),
    homeTeam: teams.home,
    awayTeam: teams.away,
  },
};

/** Static challenges for /demo — no DB or auth required. */
export const demoChallenges: Record<ChallengeView, ChallengeLanding> = {
  open: { ...base, state: "open", opponent: null },
  waiting: { ...base, state: "open", opponent: null },
  taken: {
    ...base,
    state: "accepted",
    opponent: {
      id: "00000000-0000-0000-0000-000000000011",
      handle: "jordan",
      displayName: "Jordan",
      avatarUrl: null,
    },
    acceptedAt: new Date().toISOString(),
  },
  live: {
    ...base,
    state: "live",
    opponent: {
      id: "00000000-0000-0000-0000-000000000011",
      handle: "jordan",
      displayName: "Jordan",
      avatarUrl: null,
    },
    acceptedAt: new Date().toISOString(),
    game: {
      ...base.game,
      status: "live",
      period: 2,
      clock: "5:42",
      homeScore: 14,
      awayScore: 10,
      periodScores: [
        { period: 1, home: 7, away: 3 },
        { period: 2, home: 7, away: 7 },
      ],
      updatedAt: new Date().toISOString(),
    },
  },
  settled: {
    ...base,
    state: "settled",
    outcome: "creator",
    opponent: {
      id: "00000000-0000-0000-0000-000000000011",
      handle: "jordan",
      displayName: "Jordan",
      avatarUrl: null,
    },
    acceptedAt: new Date(Date.now() - 7200_000).toISOString(),
    settledAt: new Date().toISOString(),
    game: {
      ...base.game,
      status: "final",
      period: 4,
      homeScore: 27,
      awayScore: 20,
    },
  },
  void: {
    ...base,
    state: "void",
    game: {
      ...base.game,
      status: "postponed",
    },
  },
};

export const demoViewOrder: ChallengeView[] = [
  "open",
  "waiting",
  "taken",
  "live",
  "settled",
  "void",
];
