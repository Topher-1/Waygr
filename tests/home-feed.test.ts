import { describe, expect, it } from "vitest";
import { bucketHomeChallenge } from "@/lib/challenges/home-queries";

describe("bucketHomeChallenge", () => {
  const viewerId = "viewer-1";

  it("includes accepted challenges in live bucket before kickoff", () => {
    expect(
      bucketHomeChallenge(
        { state: "accepted", creator: { id: "other-1" } },
        viewerId,
      ),
    ).toBe("live");
  });

  it("includes live challenges in live bucket", () => {
    expect(
      bucketHomeChallenge(
        { state: "live", creator: { id: "other-1" } },
        viewerId,
      ),
    ).toBe("live");
  });

  it("puts creator open challenges in openWaiting", () => {
    expect(
      bucketHomeChallenge(
        { state: "open", creator: { id: viewerId } },
        viewerId,
      ),
    ).toBe("openWaiting");
  });

  it("ignores open challenges where viewer is not creator", () => {
    expect(
      bucketHomeChallenge(
        { state: "open", creator: { id: "other-1" } },
        viewerId,
      ),
    ).toBeNull();
  });
});
