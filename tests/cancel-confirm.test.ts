import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copy } from "@/lib/copy";
import { bucketHomeChallenge } from "@/lib/challenges/home-queries";

describe("cancel confirm flow", () => {
  const homeSource = readFileSync(
    join(process.cwd(), "components/home/home-client.tsx"),
    "utf8",
  );
  const sheetSource = readFileSync(
    join(process.cwd(), "components/home/cancel-call-sheet.tsx"),
    "utf8",
  );

  it("opens confirm sheet instead of canceling on first tap", () => {
    expect(homeSource).toMatch(/CancelCallSheet/);
    expect(homeSource).toMatch(/setPendingCancel/);
    expect(homeSource).not.toMatch(
      /onClick=\{\(\) => void handleCancel\(challenge\.id\)\}/,
    );
  });

  it("only posts cancel after explicit confirm", () => {
    expect(homeSource).toMatch(/async function confirmCancel/);
    expect(homeSource).toMatch(/onConfirm=\{async \(\) =>/);
    expect(homeSource).toMatch(
      /async function confirmCancel[\s\S]*\/api\/challenges\/\$\{challengeId\}\/cancel/,
    );
    expect(homeSource).not.toMatch(
      /onClick=\{[^}]*\/api\/challenges\/\$\{challenge\.id\}\/cancel/,
    );
  });

  it("shows share-link warning in confirm sheet", () => {
    expect(sheetSource).toMatch(/copy\.home\.cancelCallBody/);
    expect(sheetSource).toMatch(/copy\.home\.cancelCallConfirm/);
    expect(sheetSource).toMatch(/copy\.home\.cancelCallKeep/);
    expect(copy.home.cancelCallBody).toMatch(/share link/i);
  });

  it("keeps accepted challenges out of the openWaiting bucket", () => {
    expect(
      bucketHomeChallenge(
        { state: "accepted", creator: { id: "creator-1" } },
        "creator-1",
      ),
    ).toBe("live");
    expect(
      bucketHomeChallenge(
        { state: "open", creator: { id: "creator-1" } },
        "creator-1",
      ),
    ).toBe("openWaiting");
  });
});
