import { formatCall, formatForfeit, formatKickoff, formatMatchup } from "@/lib/challenges/format";
import type { ChallengeLanding } from "@/lib/challenges/types";

type ChallengeHeroProps = {
  challenge: ChallengeLanding;
};

export function ChallengeHero({ challenge }: ChallengeHeroProps) {
  const call = formatCall(challenge);
  const forfeit = formatForfeit(challenge);

  return (
    <section className="space-y-3">
      <p className="text-sm text-[var(--muted)]">{formatMatchup(challenge)}</p>
      <p className="text-sm text-[var(--muted)]">
        {formatKickoff(challenge.game.startsAt)}
      </p>
      <h1 className="font-[family-name:var(--font-barlow)] text-3xl font-extrabold leading-tight">
        {challenge.creator.displayName} says {call}.
      </h1>
      <p className="text-lg text-[var(--muted)]">
        Loser {forfeit}. You in?
      </p>
    </section>
  );
}
