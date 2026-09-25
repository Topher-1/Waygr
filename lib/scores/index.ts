import { BallDontLieProvider } from '@/lib/scores/balldontlie.ts';
import { SportsDataIoProvider } from '@/lib/scores/sportsdataio.ts';
import type { ScoreProvider } from '@/lib/scores/types.ts';

export type { GameUpdate, GameUpsert, League, PeriodScore, ScoreProvider } from '@/lib/scores/types.ts';
export { BallDontLieProvider, mapBalldontlieGame, mapBalldontlieUpdate } from '@/lib/scores/balldontlie.ts';
export { SportsDataIoProvider } from '@/lib/scores/sportsdataio.ts';

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
