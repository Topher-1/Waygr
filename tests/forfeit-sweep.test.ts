import { describe, expect, it } from "vitest";
import { MemoryStore } from "@/lib/jobs/memory-store";
import { runSweep } from "@/lib/jobs/sweep";
import { PROOF_AUTO_CONFIRM_MS } from "@/lib/forfeits/actions";
import type { ForfeitRow } from "@/lib/jobs/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SETTLED_AT = new Date("2026-11-15T23:30:00.000Z");

function seedSubmittedProof(store: MemoryStore, submittedAt: Date): ForfeitRow {
  const forfeit: ForfeitRow = {
    id: "forfeit-1",
    challengeId: "challenge-1",
    owedBy: "loser",
    owedTo: "winner",
    kind: "custom",
    status: "proof_submitted",
    dueAt: new Date(SETTLED_AT.getTime() + SEVEN_DAYS_MS).toISOString(),
    paidAt: null,
  };
  store.forfeits.set(forfeit.id, forfeit);
  store.forfeitsByChallenge.set(forfeit.challengeId, forfeit);
  store.proofSubmittedAt.set(forfeit.id, submittedAt.toISOString());
  return forfeit;
}

describe("sweep · proof auto-confirm", () => {
  it("leaves proof alone before 72 hours", async () => {
    const submittedAt = SETTLED_AT;
    const store = new MemoryStore(
      new Date(submittedAt.getTime() + PROOF_AUTO_CONFIRM_MS - 60_000),
    );
    seedSubmittedProof(store, submittedAt);

    const result = await runSweep(store);

    expect(result.proofsConfirmed).toBe(0);
    expect(store.forfeits.get("forfeit-1")?.status).toBe("proof_submitted");
  });

  it("auto-confirms once 72 hours have passed", async () => {
    const submittedAt = SETTLED_AT;
    const now = new Date(submittedAt.getTime() + PROOF_AUTO_CONFIRM_MS);
    const store = new MemoryStore(now);
    seedSubmittedProof(store, submittedAt);

    const result = await runSweep(store);

    expect(result.proofsConfirmed).toBe(1);
    const forfeit = store.forfeits.get("forfeit-1");
    expect(forfeit?.status).toBe("paid");
    expect(forfeit?.paidAt).toBe(now.toISOString());
  });

  it("is idempotent — a second pass confirms nothing new", async () => {
    const submittedAt = SETTLED_AT;
    const store = new MemoryStore(
      new Date(submittedAt.getTime() + PROOF_AUTO_CONFIRM_MS + 60_000),
    );
    seedSubmittedProof(store, submittedAt);

    expect((await runSweep(store)).proofsConfirmed).toBe(1);
    expect((await runSweep(store)).proofsConfirmed).toBe(0);
  });
});

describe("sweep · jersey frames", () => {
  it("keeps the frame for the seven days after settlement, then ends it", async () => {
    const jerseyUntil = new Date(SETTLED_AT.getTime() + SEVEN_DAYS_MS);

    const duringStore = new MemoryStore(
      new Date(SETTLED_AT.getTime() + 6 * 24 * 60 * 60 * 1000),
    );
    duringStore.seedProfile({
      id: "loser",
      jerseyTeam: "KC",
      jerseyUntil: jerseyUntil.toISOString(),
    });

    const during = await runSweep(duringStore);
    expect(during.jerseysEnded).toBe(0);
    expect(duringStore.profiles.get("loser")?.jerseyTeam).toBe("KC");

    const afterStore = new MemoryStore(jerseyUntil);
    afterStore.seedProfile({
      id: "loser",
      jerseyTeam: "KC",
      jerseyUntil: jerseyUntil.toISOString(),
    });

    const after = await runSweep(afterStore);
    expect(after.jerseysEnded).toBe(1);
    expect(afterStore.profiles.get("loser")?.jerseyTeam).toBeNull();
    expect(afterStore.profiles.get("loser")?.jerseyUntil).toBeNull();
  });
});
