export type ChallengeView =
  | "open"
  | "taken"
  | "live"
  | "settled"
  | "void";

export type ChallengeLandingProfile = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ChallengeLandingTeam = {
  code: string;
  abbr: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
};

export type ChallengeLandingGame = {
  id: string;
  league: string;
  startsAt: string;
  status: string;
  period: number | null;
  clock: string | null;
  homeScore: number;
  awayScore: number;
  homeTeam: ChallengeLandingTeam;
  awayTeam: ChallengeLandingTeam;
};

export type ChallengeLanding = {
  id: string;
  slug: string;
  state: string;
  market: string;
  creatorPick: string;
  line: string | null;
  quarter: number | null;
  forfeitKind: string;
  forfeitText: string | null;
  outcome: string | null;
  acceptedAt: string | null;
  settledAt: string | null;
  creator: ChallengeLandingProfile;
  opponent: ChallengeLandingProfile | null;
  game: ChallengeLandingGame;
};

export type AcceptRejectReason =
  | "not_found"
  | "own_challenge"
  | "past_kickoff"
  | "taken"
  | "not_open"
  | "adult_required"
  | "unauthorized"
  | "missing_opponent"
  | "conflict";
