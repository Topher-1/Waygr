import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { WaygrBusyMark } from "@/components/ui/waygr-busy-mark";

type Variant = "primary" | "secondary" | "ghost";

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
  ...props
}: BusyButtonProps) {
  const showBusy = loading && loadingLabel !== undefined;

  return (
    <Button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      aria-busy={loading || undefined}
      {...props}
    >
      {showBusy ? (
        <>
          <WaygrBusyMark />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
