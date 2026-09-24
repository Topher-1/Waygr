import type { SupabaseClient } from '@supabase/supabase-js';
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

type DbGame = {
  id: string;
  provider: string;
  provider_game_id: string;
  league: GameRow['league'];
  home_team: string;
  away_team: string;
  starts_at: string;
  status: GameRow['status'];
  period: number | null;
  clock: string | null;
  home_score: number;
  away_score: number;
  period_scores: GameRow['periodScores'];
  updated_at: string;
};

type DbChallenge = {
  id: string;
  slug: string;
  creator_id: string;
  opponent_id: string | null;
  game_id: string;
  market: ChallengeRow['market'];
  creator_pick: ChallengeRow['creatorPick'];
  line: string | null;
  quarter: number | null;
  forfeit_kind: ChallengeRow['forfeitKind'];
  forfeit_text: string | null;
  state: ChallengeRow['state'];
  outcome: ChallengeRow['outcome'];
  settled_at: string | null;
};

const SCHEDULE_META_KEY = 'poll_scores_last_schedule_refresh';

function mapGame(row: DbGame): GameRow {
  return {
    id: row.id,
    provider: row.provider,
    providerGameId: row.provider_game_id,
    league: row.league,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    startsAt: row.starts_at,
    status: row.status,
    period: row.period,
    clock: row.clock,
    homeScore: row.home_score,
    awayScore: row.away_score,
    periodScores: row.period_scores ?? [],
    updatedAt: row.updated_at,
  };
}

function mapChallenge(row: DbChallenge): ChallengeRow {
  return {
    id: row.id,
    slug: row.slug,
    creatorId: row.creator_id,
    opponentId: row.opponent_id,
    gameId: row.game_id,
    market: row.market,
    creatorPick: row.creator_pick,
    line: row.line === null ? null : Number(row.line),
    quarter: row.quarter,
    forfeitKind: row.forfeit_kind,
    forfeitText: row.forfeit_text,
    state: row.state,
    outcome: row.outcome,
    settledAt: row.settled_at,
  };
}

export class SupabaseJobStore implements PollScoresStore, SettleStore, SweepStore {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  now(): Date {
    return this.clock();
  }

  async lastScheduleRefreshAt(): Promise<Date | null> {
    const { data, error } = await this.supabase
      .from('job_meta')
      .select('value')
      .eq('key', SCHEDULE_META_KEY)
      .maybeSingle();
    if (error) throw error;
    return data?.value ? new Date(String(data.value)) : null;
  }

  async setLastScheduleRefreshAt(at: Date): Promise<void> {
    const { error } = await this.supabase.from('job_meta').upsert({
      key: SCHEDULE_META_KEY,
      value: at.toISOString(),
    });
    if (error) throw error;
  }

  async listGamesNeedingLivePoll(now: Date): Promise<GameRow[]> {
    const { data: challengeRows, error: challengeError } = await this.supabase
      .from('challenges')
      .select('game_id')
      .in('state', ['accepted', 'live']);
    if (challengeError) throw challengeError;

    const gameIds = [...new Set((challengeRows ?? []).map((r) => r.game_id))];
    if (gameIds.length === 0) return [];

    const cutoff = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .in('id', gameIds)
      .or(`status.eq.live,and(status.eq.scheduled,starts_at.lte.${cutoff})`);
    if (error) throw error;
    return (data as DbGame[]).map(mapGame);
  }

  async listLeaguesWithActiveChallenges(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('challenges')
      .select('games!inner(league)')
      .in('state', ['open', 'accepted', 'live']);
    if (error) throw error;
    const leagues = new Set<string>();
    for (const row of data ?? []) {
      const game = row.games as { league: string };
      leagues.add(game.league);
    }
    return [...leagues];
  }

  async upsertScheduleGames(games: GameRow[]): Promise<void> {
    if (games.length === 0) return;
    for (const g of games) {
      const existing = await this.getGameByProviderId(g.providerGameId);
      const keepScores = existing?.status === 'live' || existing?.status === 'final';
      const row = {
        provider: g.provider,
        provider_game_id: g.providerGameId,
        league: g.league,
        home_team: g.homeTeam,
        away_team: g.awayTeam,
        starts_at: g.startsAt,
        status: keepScores ? existing!.status : g.status,
        period: keepScores ? existing!.period : g.period,
        clock: keepScores ? existing!.clock : g.clock,
        home_score: keepScores ? existing!.homeScore : g.homeScore,
        away_score: keepScores ? existing!.awayScore : g.awayScore,
        period_scores: keepScores ? existing!.periodScores : g.periodScores,
        updated_at: g.updatedAt,
      };
      const { error } = await this.supabase.from('games').upsert(row, {
        onConflict: 'provider,provider_game_id',
      });
      if (error) throw error;
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
    const { data, error } = await this.supabase
      .from('games')
      .update({
        status: update.status,
        period: update.period,
        clock: update.clock,
        home_score: update.homeScore,
        away_score: update.awayScore,
        period_scores: update.periodScores,
        updated_at: this.now().toISOString(),
      })
      .eq('id', gameId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? mapGame(data as DbGame) : null;
  }

  async getGameByProviderId(providerGameId: string): Promise<GameRow | undefined> {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .eq('provider_game_id', providerGameId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapGame(data as DbGame) : undefined;
  }

  async getGame(id: string): Promise<GameRow | undefined> {
    const { data, error } = await this.supabase.from('games').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapGame(data as DbGame) : undefined;
  }

  async listChallengesForGame(gameId: string, states: string[]): Promise<ChallengeRow[]> {
    const { data, error } = await this.supabase
      .from('challenges')
      .select('*')
      .eq('game_id', gameId)
      .in('state', states);
    if (error) throw error;
    return (data as DbChallenge[]).map(mapChallenge);
  }

  async updateChallenge(
    id: string,
    patch: Partial<ChallengeRow>,
    onlyIfStateIn: string[],
  ): Promise<ChallengeRow | null> {
    const update: Record<string, unknown> = {};
    if (patch.state) update.state = patch.state;
    if (patch.outcome !== undefined) update.outcome = patch.outcome;
    if (patch.settledAt !== undefined) update.settled_at = patch.settledAt;

    const { data, error } = await this.supabase
      .from('challenges')
      .update(update)
      .eq('id', id)
      .in('state', onlyIfStateIn)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? mapChallenge(data as DbChallenge) : null;
  }

  async getForfeitByChallenge(challengeId: string): Promise<ForfeitRow | undefined> {
    const { data, error } = await this.supabase
      .from('forfeits')
      .select('*')
      .eq('challenge_id', challengeId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return {
      id: data.id,
      challengeId: data.challenge_id,
      owedBy: data.owed_by,
      owedTo: data.owed_to,
      kind: data.kind,
      status: data.status,
      dueAt: data.due_at,
      paidAt: data.paid_at,
    };
  }

  async insertForfeit(row: Omit<ForfeitRow, 'id'>): Promise<ForfeitRow> {
    const { data, error } = await this.supabase
      .from('forfeits')
      .insert({
        challenge_id: row.challengeId,
        owed_by: row.owedBy,
        owed_to: row.owedTo,
        kind: row.kind,
        status: row.status,
        due_at: row.dueAt,
        paid_at: row.paidAt,
      })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      challengeId: data.challenge_id,
      owedBy: data.owed_by,
      owedTo: data.owed_to,
      kind: data.kind,
      status: data.status,
      dueAt: data.due_at,
      paidAt: data.paid_at,
    };
  }

  async insertNotification(row: Omit<NotificationRow, 'sentAt'>): Promise<NotificationRow | null> {
    const { data, error } = await this.supabase
      .from('notifications_sent')
      .insert({
        user_id: row.userId,
        kind: row.kind,
        ref_id: row.refId,
      })
      .select('*')
      .maybeSingle();
    if (error) {
      if (error.code === '23505') return null;
      throw error;
    }
    return data
      ? { userId: data.user_id, kind: data.kind, refId: data.ref_id, sentAt: data.sent_at }
      : null;
  }

  async updateProfile(id: string, patch: Partial<ProfileRow>): Promise<void> {
    const update: Record<string, unknown> = {};
    if (patch.jerseyTeam !== undefined) update.jersey_team = patch.jerseyTeam;
    if (patch.jerseyUntil !== undefined) update.jersey_until = patch.jerseyUntil;
    const { error } = await this.supabase.from('profiles').update(update).eq('id', id);
    if (error) throw error;
  }

  async getProfile(id: string): Promise<ProfileRow | undefined> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, jersey_team, jersey_until')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return {
      id: data.id,
      jerseyTeam: data.jersey_team,
      jerseyUntil: data.jersey_until,
    };
  }

  async getTeamAbbr(teamCode: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('teams')
      .select('abbr')
      .eq('code', teamCode)
      .maybeSingle();
    if (error) throw error;
    return data?.abbr ?? teamCode.split(':')[1] ?? teamCode;
  }

  async listOpenChallengesPastKickoff(now: Date): Promise<ChallengeRow[]> {
    const { data, error } = await this.supabase
      .from('challenges')
      .select('*, games!inner(starts_at)')
      .eq('state', 'open')
      .lte('games.starts_at', now.toISOString());
    if (error) throw error;
    return (data as DbChallenge[]).map(mapChallenge);
  }

  async listChallengesOnVoidGames(): Promise<{ challenge: ChallengeRow; game: GameRow }[]> {
    const { data, error } = await this.supabase
      .from('challenges')
      .select('*, games!inner(*)')
      .in('state', ['accepted', 'live'])
      .in('games.status', ['postponed', 'canceled']);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      challenge: mapChallenge(row as DbChallenge),
      game: mapGame((row as { games: DbGame }).games),
    }));
  }

  async listProofsPendingAutoConfirm(): Promise<{ forfeitId: string; submittedAt: string }[]> {
    const { data, error } = await this.supabase
      .from('forfeits')
      .select('id, proof_submitted_at')
      .eq('status', 'proof_submitted')
      .not('proof_submitted_at', 'is', null);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      forfeitId: r.id,
      submittedAt: r.proof_submitted_at as string,
    }));
  }

  async listExpiredJerseyProfiles(now: Date): Promise<{ profileId: string }[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id')
      .not('jersey_until', 'is', null)
      .lte('jersey_until', now.toISOString());
    if (error) throw error;
    return (data ?? []).map((r) => ({ profileId: r.id }));
  }

  async expireChallenge(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('challenges')
      .update({ state: 'expired' })
      .eq('id', id)
      .eq('state', 'open')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async voidChallenge(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('challenges')
      .update({ state: 'void', outcome: null, settled_at: null })
      .eq('id', id)
      .in('state', ['accepted', 'live'])
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async confirmForfeit(id: string, paidAt: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('forfeits')
      .update({ status: 'paid', paid_at: paidAt })
      .eq('id', id)
      .eq('status', 'proof_submitted')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async clearJersey(profileId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ jersey_team: null, jersey_until: null })
      .eq('id', profileId)
      .not('jersey_until', 'is', null)
      .lte('jersey_until', this.now().toISOString())
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }
}
