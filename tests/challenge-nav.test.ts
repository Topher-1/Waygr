import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("challenge navigation escape hatch", () => {
  const shellSource = readFileSync(
    join(process.cwd(), "components/challenge/challenge-shell.tsx"),
    "utf8",
  );
  const clientSource = readFileSync(
    join(process.cwd(), "components/challenge/challenge-client.tsx"),
    "utf8",
  );

  it("links the wordmark to home", () => {
    expect(shellSource).toMatch(/from "next\/link"/);
    expect(shellSource).toMatch(/<Link[\s\S]*href="\/"/);
    expect(shellSource).not.toMatch(/<span[\s\S]*\{APP_NAME\}/);
  });

  it("shows a Make a call link on live and post-accept views", () => {
    expect(clientSource).toMatch(/showHomeEscape/);
    expect(clientSource).toMatch(/view === "live"/);
    expect(clientSource).toMatch(/<Link[\s\S]*href="\/"/);
    expect(clientSource).toMatch(/copy\.home\.makeCall/);
  });
});
