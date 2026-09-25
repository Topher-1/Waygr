import { BallDontLieProvider } from '@/lib/scores/balldontlie';
import type { League, ScoreProvider } from '@/lib/scores/types';
import type { GameRow, PollScoresResult } from '@/lib/jobs/types';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface PollScoresStore {
  now(): Date;
  lastScheduleRefreshAt(): Promise<Date | null>;
  setLastScheduleRefreshAt(at: Date): Promise<void>;
  listGamesNeedingLivePoll(now: Date): Promise<GameRow[]>;
  listLeaguesWithActiveChallenges(): Promise<string[]>;
  upsertScheduleGames(games: GameRow[]): Promise<void>;
  updateGameFromProvider(
    gameId: string,
    update: {
      status: GameRow['status'];
      period: number | null;
      clock: string | null;
      homeScore: number;
      awayScore: number;
      periodScores: GameRow['periodScores'];
    },
  ): Promise<GameRow | null>;
  getGameByProviderId(providerGameId: string): Promise<GameRow | undefined>;
}

async function fetchLiveUpdates(
  provider: ScoreProvider,
  league: League,
  providerGameIds: string[],
): Promise<import('@/lib/scores/types').GameUpdate[]> {
  if (providerGameIds.length === 0) return [];
  if (provider instanceof BallDontLieProvider) {
    return provider.getLiveForLeague(league, providerGameIds);
  }
  return provider.getLive(providerGameIds);
}

function gameNeedsLivePoll(game: GameRow, now: Date): boolean {
  const startsSoon = new Date(game.startsAt).getTime() - now.getTime() <= FIFTEEN_MINUTES_MS;
  const isLive = game.status === 'live';
  return isLive || (startsSoon && game.status === 'scheduled');
}

export async function runPollScores(
  store: PollScoresStore,
  provider: ScoreProvider,
): Promise<PollScoresResult> {
  const now = store.now();
  const updatedGameIds: string[] = [];

  const candidates = await store.listGamesNeedingLivePoll(now);
  const byLeague = new Map<League, GameRow[]>();
  for (const game of candidates) {
    const list = byLeague.get(game.league) ?? [];
    list.push(game);
    byLeague.set(game.league, list);
  }

  for (const [league, games] of byLeague) {
    const updates = await fetchLiveUpdates(
      provider,
      league,
      games.map((g) => g.providerGameId),
    );

    for (const update of updates) {
      const game = await store.getGameByProviderId(update.providerGameId);
      if (!game) continue;

      const changed =
        game.status !== update.status ||
        game.period !== update.period ||
        game.clock !== update.clock ||
        game.homeScore !== update.homeScore ||
        game.awayScore !== update.awayScore ||
        JSON.stringify(game.periodScores) !== JSON.stringify(update.periodScores);

      if (!changed) continue;

      const row = await store.updateGameFromProvider(game.id, update);
      if (row) updatedGameIds.push(row.id);
    }
  }

  let scheduleRefreshed = false;
  const lastRefresh = await store.lastScheduleRefreshAt();
  const shouldRefresh =
    !lastRefresh || now.getTime() - lastRefresh.getTime() >= TEN_MINUTES_MS;

  if (shouldRefresh) {
    const leagues = await store.listLeaguesWithActiveChallenges();
    const from = now;
    const to = new Date(now.getTime() + SEVEN_DAYS_MS);
    const upserts: GameRow[] = [];

    for (const league of leagues) {
      const games = await provider.listGames(league as League, from, to);
      for (const g of games) {
        const existing = await store.getGameByProviderId(g.providerGameId);
        const keepScores = existing?.status === 'live' || existing?.status === 'final';
        upserts.push({
          id: existing?.id ?? crypto.randomUUID(),
          provider: provider.name,
          providerGameId: g.providerGameId,
          league: g.league,
          homeTeam: g.homeTeamCode,
          awayTeam: g.awayTeamCode,
          startsAt: g.startsAt.toISOString(),
          status: keepScores ? existing!.status : g.status,
          period: keepScores ? existing!.period : g.period,
          clock: keepScores ? existing!.clock : g.clock,
          homeScore: keepScores ? existing!.homeScore : g.homeScore,
          awayScore: keepScores ? existing!.awayScore : g.awayScore,
          periodScores: keepScores ? existing!.periodScores : g.periodScores,
          updatedAt: now.toISOString(),
        });
      }
    }

    await store.upsertScheduleGames(upserts);
    await store.setLastScheduleRefreshAt(now);
    scheduleRefreshed = true;
  }

  return { updatedGameIds, scheduleRefreshed };
}

export { gameNeedsLivePoll };
