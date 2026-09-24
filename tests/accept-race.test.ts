import { describe, expect, it } from "vitest";
import {
  simulateAcceptRace,
  validateAccept,
} from "@/lib/challenges/accept";

describe("accept validation", () => {
  const base = {
    challengeState: "open",
    creatorId: "creator",
    opponentId: null as string | null,
    kickoffAt: new Date(Date.now() + 60_000),
    actorProfileId: "opponent",
    adultConfirmedAt: new Date(),
    now: new Date(),
  };

  it("rejects own challenge", () => {
    const result = validateAccept({
      ...base,
      actorProfileId: "creator",
    });
    expect(result).toEqual({ ok: false, reason: "own_challenge" });
  });

  it("rejects after kickoff", () => {
    const result = validateAccept({
      ...base,
      kickoffAt: new Date(Date.now() - 1_000),
    });
    expect(result).toEqual({ ok: false, reason: "past_kickoff" });
  });

  it("rejects without adult confirmation", () => {
    const result = validateAccept({
      ...base,
      adultConfirmedAt: null,
    });
    expect(result).toEqual({ ok: false, reason: "adult_required" });
  });

  it("rejects when already taken", () => {
    const result = validateAccept({
      ...base,
      opponentId: "other",
    });
    expect(result).toEqual({ ok: false, reason: "taken" });
  });
});

describe("accept race", () => {
  it("allows exactly one winner when two tap at once", () => {
    const now = new Date();
    const kickoff = new Date(now.getTime() + 3600_000);
    const adult = new Date();

    const { winner, losers } = simulateAcceptRace(
      [
        { profileId: "alice", adultConfirmedAt: adult },
        { profileId: "bob", adultConfirmedAt: adult },
      ],
      {
        state: "open",
        creatorId: "creator",
        opponentId: null,
        kickoffAt: kickoff,
      },
      now,
    );

    expect(winner).toBe("alice");
    expect(losers).toEqual(["bob"]);
  });
});
