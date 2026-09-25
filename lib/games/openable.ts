import type { GameStatus } from "@/lib/settle";

/** Games that still allow creating or accepting open challenges. */
export function isGameOpenable(status: GameStatus | string): boolean {
  return status === "scheduled" || status === "live";
}

/** Games where open challenges should expire and accepts are blocked. */
export function isGameTerminal(status: GameStatus | string): boolean {
  return !isGameOpenable(status);
}
