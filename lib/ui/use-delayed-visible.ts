import { useEffect, useState } from "react";

/** Reveal busy chrome only after `delayMs` to avoid sub-threshold flicker (≈150–300 ms). */
export function useDelayedVisible(active: boolean, delayMs = 200): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [active, delayMs]);

  return visible;
}
