import type { ChallengeRow, GameRow, SweepResult } from '@/lib/jobs/types';

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

export interface SweepStore {
  now(): Date;
  listOpenChallengesPastKickoff(now: Date): Promise<ChallengeRow[]>;
  listChallengesOnVoidGames(): Promise<{ challenge: ChallengeRow; game: GameRow }[]>;
  listProofsPendingAutoConfirm(): Promise<{ forfeitId: string; submittedAt: string }[]>;
  listExpiredJerseyProfiles(now: Date): Promise<{ profileId: string }[]>;
  expireChallenge(id: string): Promise<boolean>;
  voidChallenge(id: string): Promise<boolean>;
  confirmForfeit(id: string, paidAt: string): Promise<boolean>;
  clearJersey(profileId: string): Promise<boolean>;
}

export async function runSweep(store: SweepStore): Promise<SweepResult> {
  const now = store.now();
  const result: SweepResult = {
    expired: 0,
    voided: 0,
    proofsConfirmed: 0,
    jerseysEnded: 0,
  };

  for (const challenge of await store.listOpenChallengesPastKickoff(now)) {
    if (await store.expireChallenge(challenge.id)) result.expired++;
  }

  for (const { challenge } of await store.listChallengesOnVoidGames()) {
    if (challenge.state === 'accepted' || challenge.state === 'live') {
      if (await store.voidChallenge(challenge.id)) result.voided++;
    }
  }

  for (const proof of await store.listProofsPendingAutoConfirm()) {
    const submitted = new Date(proof.submittedAt).getTime();
    if (now.getTime() - submitted >= SEVENTY_TWO_HOURS_MS) {
      if (await store.confirmForfeit(proof.forfeitId, now.toISOString())) {
        result.proofsConfirmed++;
      }
    }
  }

  for (const { profileId } of await store.listExpiredJerseyProfiles(now)) {
    if (await store.clearJersey(profileId)) result.jerseysEnded++;
  }

  return result;
}
