import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { WaygrBusyMark } from "@/components/ui/waygr-busy-mark";
import { useDelayedVisible } from "@/lib/ui/use-delayed-visible";

type Variant = "primary" | "secondary" | "ghost";

/** Anti-flicker delay before revealing the brand-ring (150–300 ms band). */
export const BUSY_MARK_DELAY_MS = 200;

type BusyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: ReactNode;
};

export function BusyButton({
  loading = false,
  loadingLabel,
  disabled,
  children,
  className = "",
  variant = "primary",
  ...props
}: BusyButtonProps) {
  const isBusy = loading && loadingLabel !== undefined;
  const showMark = useDelayedVisible(isBusy, BUSY_MARK_DELAY_MS);

  const busyClasses = isBusy
    ? "scale-[0.98] bg-[var(--orange)] text-[var(--on-accent)] border-transparent disabled:opacity-90"
    : "";

  return (
    <Button
      variant={variant}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-transform ${busyClasses} ${className}`}
      aria-busy={loading || undefined}
      {...props}
    >
      {isBusy ? (
        <>
          {showMark ? <WaygrBusyMark onAccent /> : null}
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
