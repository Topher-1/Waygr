import { BallDontLieProvider } from '@/lib/scores/balldontlie';
import { SportsDataIoProvider } from '@/lib/scores/sportsdataio';
import type { ScoreProvider } from '@/lib/scores/types';

export type { GameUpdate, GameUpsert, League, PeriodScore, ScoreProvider } from '@/lib/scores/types';
export { BallDontLieProvider, mapBalldontlieGame, mapBalldontlieUpdate } from '@/lib/scores/balldontlie';
export { SportsDataIoProvider } from '@/lib/scores/sportsdataio';

export function createScoreProvider(options?: {
  provider?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}): ScoreProvider {
  const name = (options?.provider ?? process.env.SCORE_PROVIDER ?? 'balldontlie').toLowerCase();
  const apiKey = options?.apiKey ?? process.env.BALLDONTLIE_API_KEY;

  switch (name) {
    case 'balldontlie':
      return new BallDontLieProvider(apiKey, options?.fetchImpl);
    case 'sportsdataio':
      return new SportsDataIoProvider();
    default:
      throw new Error(`Unknown SCORE_PROVIDER: ${name}`);
  }
}
