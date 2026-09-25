export type ShareChallengeResult = "shared" | "aborted" | "copied";

type SharePayload = {
  title: string;
  text: string;
  url: string;
};

/** Share a challenge link; distinguish user dismiss from clipboard fallback. */
export async function shareChallengeLink(
  payload: SharePayload,
): Promise<ShareChallengeResult> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "aborted";
      }
      if (typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(payload.url);
        return "copied";
      }
      return "aborted";
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(payload.url);
    return "copied";
  }

  return "aborted";
}
