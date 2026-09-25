import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("forfeit busy feedback", () => {
  const source = readFileSync(
    join(process.cwd(), "components/forfeit/forfeit-client.tsx"),
    "utf8",
  );

  it("uses BusyButton for paid-confirm actions", () => {
    expect(source).toMatch(/from "@\/components\/ui\/busy-button"/);
    expect(source).toMatch(/BusyButton/);
    expect(source).toMatch(/copy\.forfeit\.markingDone/);
    expect(source).toMatch(/copy\.forfeit\.confirmingProof/);
    expect(source).toMatch(/copy\.forfeit\.rejectingProof/);
    expect(source).not.toMatch(/from "@\/components\/ui\/button"/);
  });
});
