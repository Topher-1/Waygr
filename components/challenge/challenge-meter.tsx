import type { ChallengeMeter as ChallengeMeterData } from "@/lib/challenges/meter";

type ChallengeMeterProps = {
  meter: ChallengeMeterData;
};

export function ChallengeMeter({ meter }: ChallengeMeterProps) {
  return (
    <div
      className="flex h-2 overflow-hidden rounded-full bg-[var(--raised)]"
      role="meter"
      aria-valuenow={meter.viewerShare}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Challenge progress"
    >
      <div
        className="h-full bg-[var(--orange)] transition-[width] duration-250 ease-out"
        style={{ width: `${meter.viewerShare}%` }}
      />
      <div className="h-full flex-1 bg-[var(--blue)] transition-[width] duration-250 ease-out" />
    </div>
  );
}
