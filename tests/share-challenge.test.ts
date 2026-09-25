import { describe, expect, it, vi, beforeEach } from "vitest";
import { shareChallengeLink } from "@/lib/challenges/share-challenge";

describe("shareChallengeLink", () => {
  const payload = {
    title: "Waygr",
    text: "You're on the line.",
    url: "https://waygr.vercel.app/c/abc123",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns shared when navigator.share resolves", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockResolvedValue(undefined),
      clipboard: { writeText: vi.fn() },
    });

    await expect(shareChallengeLink(payload)).resolves.toBe("shared");
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("returns aborted when user dismisses the share sheet", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")),
      clipboard: { writeText: vi.fn() },
    });

    await expect(shareChallengeLink(payload)).resolves.toBe("aborted");
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("copies to clipboard on non-abort share errors", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("share failed")),
      clipboard: { writeText },
    });

    await expect(shareChallengeLink(payload)).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(payload.url);
  });

  it("copies when navigator.share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    });

    await expect(shareChallengeLink(payload)).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(payload.url);
  });
});
