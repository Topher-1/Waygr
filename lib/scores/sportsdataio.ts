import type { GameUpdate, GameUpsert, League, ScoreProvider } from '@/lib/scores/types';

/**
 * Typed fallback stub — SportsDataIO is only used when Chris flips SCORE_PROVIDER.
 * No live API calls; swap in a real adapter after tier confirmation.
 */
export class SportsDataIoProvider implements ScoreProvider {
  readonly name = 'sportsdataio';

  async listGames(_league: League, _from: Date, _to: Date): Promise<GameUpsert[]> {
    throw new Error('SportsDataIO adapter is not implemented — set SCORE_PROVIDER=balldontlie');
  }

  async getLive(_providerGameIds: string[]): Promise<GameUpdate[]> {
    throw new Error('SportsDataIO adapter is not implemented — set SCORE_PROVIDER=balldontlie');
  }
}
