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
    gameStatus: "live",
    actorProfileId: "opponent",
    adultConfirmedAt: new Date(),
  };

  it("rejects own challenge", () => {
    const result = validateAccept({
      ...base,
      actorProfileId: "creator",
    });
    expect(result).toEqual({ ok: false, reason: "own_challenge" });
  });

  it("allows accept during a live game", () => {
    const result = validateAccept({
      ...base,
      gameStatus: "live",
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects when game is final", () => {
    const result = validateAccept({
      ...base,
      gameStatus: "final",
    });
    expect(result).toEqual({ ok: false, reason: "game_over" });
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
        gameStatus: "live",
      },
    );

    expect(winner).toBe("alice");
    expect(losers).toEqual(["bob"]);
  });
});
