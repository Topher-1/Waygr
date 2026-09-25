import type { ForfeitMutationFailure } from "@/lib/forfeits/mutations";

/** Map a forfeit rule failure onto an HTTP status. */
export function forfeitErrorStatus(reason: ForfeitMutationFailure): number {
  switch (reason) {
    case "not_found":
      return 404;
    case "not_party":
      return 403;
    case "mime":
      return 415;
    case "size":
      return 413;
    case "storage":
      return 502;
    default:
      return 409;
  }
}
