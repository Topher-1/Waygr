import type { PollScoresStore } from '@/lib/jobs/poll-scores';
import type { SettleStore } from '@/lib/jobs/settle';
import type { SweepStore } from '@/lib/jobs/sweep';
import type {
  ChallengeRow,
  ForfeitRow,
  GameRow,
  NotificationRow,
  ProfileRow,
} from '@/lib/jobs/types';

export class MemoryStore implements PollScoresStore, SettleStore, SweepStore {
  games = new Map<string, GameRow>();
  gamesByProvider = new Map<string, GameRow>();
  challenges = new Map<string, ChallengeRow>();
  forfeits = new Map<string, ForfeitRow>();
  forfeitsByChallenge = new Map<string, ForfeitRow>();
  notifications = new Map<string, NotificationRow>();
  profiles = new Map<string, ProfileRow>();
  teamAbbrs = new Map<string, string>();
  proofSubmittedAt = new Map<string, string>();
  private currentTime: Date;
  private lastScheduleRefresh: Date | null = null;

  constructor(now = new Date()) {
    this.currentTime = now;
  }

  setNow(now: Date): void {
    this.currentTime = now;
  }

  now(): Date {
    return this.currentTime;
  }

  seedGame(game: GameRow): void {
    this.games.set(game.id, game);
    this.gamesByProvider.set(`${game.provider}:${game.providerGameId}`, game);
  }

  seedChallenge(challenge: ChallengeRow): void {
    this.challenges.set(challenge.id, challenge);
  }

  seedProfile(profile: ProfileRow): void {
    this.profiles.set(profile.id, profile);
  }

  seedTeamAbbr(code: string, abbr: string): void {
    this.teamAbbrs.set(code, abbr);
  }

  async lastScheduleRefreshAt(): Promise<Date | null> {
    return this.lastScheduleRefresh;
  }

  async setLastScheduleRefreshAt(at: Date): Promise<void> {
    this.lastScheduleRefresh = at;
  }

  async listGamesNeedingLivePoll(now: Date): Promise<GameRow[]> {
    const activeGameIds = new Set(
      [...this.challenges.values()]
        .filter((c) => c.state === 'accepted' || c.state === 'live')
        .map((c) => c.gameId),
    );

    return [...this.games.values()].filter((game) => {
      if (!activeGameIds.has(game.id)) return false;
      const startsSoon =
        new Date(game.startsAt).getTime() - now.getTime() <= 15 * 60 * 1000;
      return game.status === 'live' || (startsSoon && game.status === 'scheduled');
    });
  }

  async listLeaguesWithActiveChallenges(): Promise<string[]> {
    const leagues = new Set<string>();
    for (const c of this.challenges.values()) {
      const game = this.games.get(c.gameId);
      if (game) leagues.add(game.league);
    }
    return [...leagues];
  }

  async upsertScheduleGames(games: GameRow[]): Promise<void> {
    for (const g of games) {
      const key = `${g.provider}:${g.providerGameId}`;
      const existing = this.gamesByProvider.get(key);
      if (existing) {
        const keepScores = existing.status === 'live' || existing.status === 'final';
        const merged = keepScores
          ? {
              ...existing,
              startsAt: g.startsAt,
              homeTeam: g.homeTeam,
              awayTeam: g.awayTeam,
              league: g.league,
              updatedAt: g.updatedAt,
            }
          : { ...existing, ...g, id: existing.id };
        this.games.set(existing.id, merged);
        this.gamesByProvider.set(key, merged);
      } else {
        this.games.set(g.id, g);
        this.gamesByProvider.set(key, g);
      }
    }
  }

  async updateGameFromProvider(
    gameId: string,
    update: {
      status: GameRow['status'];
      period: number | null;
      clock: string | null;
      homeScore: number;
      awayScore: number;
      periodScores: GameRow['periodScores'];
    },
  ): Promise<GameRow | null> {
    const game = this.games.get(gameId);
    if (!game) return null;
    const row = {
      ...game,
      ...update,
      updatedAt: this.currentTime.toISOString(),
    };
    this.games.set(gameId, row);
    this.gamesByProvider.set(`${game.provider}:${game.providerGameId}`, row);
    return row;
  }

  async getGameByProviderId(providerGameId: string): Promise<GameRow | undefined> {
    for (const game of this.games.values()) {
      if (game.providerGameId === providerGameId) return game;
    }
    return undefined;
  }

  async getGame(id: string): Promise<GameRow | undefined> {
    return this.games.get(id);
  }

  async listChallengesForGame(gameId: string, states: string[]): Promise<ChallengeRow[]> {
    return [...this.challenges.values()].filter(
      (c) => c.gameId === gameId && states.includes(c.state),
    );
  }

  async updateChallenge(
    id: string,
    patch: Partial<ChallengeRow>,
    onlyIfStateIn: string[],
  ): Promise<ChallengeRow | null> {
    const row = this.challenges.get(id);
    if (!row || !onlyIfStateIn.includes(row.state)) return null;
    const updated = { ...row, ...patch };
    this.challenges.set(id, updated);
    return updated;
  }

  async getForfeitByChallenge(challengeId: string): Promise<ForfeitRow | undefined> {
    return this.forfeitsByChallenge.get(challengeId);
  }

  async insertForfeit(row: Omit<ForfeitRow, 'id'>): Promise<ForfeitRow> {
    const forfeit: ForfeitRow = { ...row, id: crypto.randomUUID() };
    this.forfeits.set(forfeit.id, forfeit);
    this.forfeitsByChallenge.set(forfeit.challengeId, forfeit);
    return forfeit;
  }

  async insertNotification(row: Omit<NotificationRow, 'sentAt'>): Promise<NotificationRow | null> {
    const key = `${row.userId}:${row.kind}:${row.refId}`;
    if (this.notifications.has(key)) return null;
    const notification: NotificationRow = {
      ...row,
      sentAt: this.currentTime.toISOString(),
    };
    this.notifications.set(key, notification);
    return notification;
  }

  async updateProfile(id: string, patch: Partial<ProfileRow>): Promise<void> {
    const profile = this.profiles.get(id) ?? { id, jerseyTeam: null, jerseyUntil: null };
    this.profiles.set(id, { ...profile, ...patch });
  }

  async getProfile(id: string): Promise<ProfileRow | undefined> {
    return this.profiles.get(id);
  }

  async getTeamAbbr(teamCode: string): Promise<string> {
    return this.teamAbbrs.get(teamCode) ?? teamCode.split(':')[1] ?? teamCode;
  }

  async listOpenChallengesPastKickoff(now: Date): Promise<ChallengeRow[]> {
    return [...this.challenges.values()].filter((c) => {
      if (c.state !== 'open') return false;
      const game = this.games.get(c.gameId);
      if (!game) return false;
      return new Date(game.startsAt) <= now;
    });
  }

  async listChallengesOnVoidGames(): Promise<{ challenge: ChallengeRow; game: GameRow }[]> {
    const rows: { challenge: ChallengeRow; game: GameRow }[] = [];
    for (const challenge of this.challenges.values()) {
      const game = this.games.get(challenge.gameId);
      if (!game) continue;
      if (game.status === 'postponed' || game.status === 'canceled') {
        rows.push({ challenge, game });
      }
    }
    return rows;
  }

  async listProofsPendingAutoConfirm(): Promise<{ forfeitId: string; submittedAt: string }[]> {
    const rows: { forfeitId: string; submittedAt: string }[] = [];
    for (const forfeit of this.forfeits.values()) {
      if (forfeit.status !== 'proof_submitted') continue;
      const submittedAt = this.proofSubmittedAt.get(forfeit.id);
      if (submittedAt) rows.push({ forfeitId: forfeit.id, submittedAt });
    }
    return rows;
  }

  async listExpiredJerseyProfiles(now: Date): Promise<{ profileId: string }[]> {
    const rows: { profileId: string }[] = [];
    for (const profile of this.profiles.values()) {
      if (profile.jerseyUntil && new Date(profile.jerseyUntil) <= now) {
        rows.push({ profileId: profile.id });
      }
    }
    return rows;
  }

  async expireChallenge(id: string): Promise<boolean> {
    const row = this.challenges.get(id);
    if (!row || row.state !== 'open') return false;
    this.challenges.set(id, { ...row, state: 'expired' });
    return true;
  }

  async voidChallenge(id: string): Promise<boolean> {
    const row = this.challenges.get(id);
    if (!row || (row.state !== 'accepted' && row.state !== 'live')) return false;
    this.challenges.set(id, { ...row, state: 'void', outcome: null, settledAt: null });
    return true;
  }

  async confirmForfeit(id: string, paidAt: string): Promise<boolean> {
    const forfeit = this.forfeits.get(id);
    if (!forfeit || forfeit.status !== 'proof_submitted') return false;
    this.forfeits.set(id, { ...forfeit, status: 'paid', paidAt });
    return true;
  }

  async clearJersey(profileId: string): Promise<boolean> {
    const profile = this.profiles.get(profileId);
    if (!profile?.jerseyUntil || new Date(profile.jerseyUntil) > this.currentTime) return false;
    this.profiles.set(profileId, { ...profile, jerseyTeam: null, jerseyUntil: null });
    return true;
  }
}
