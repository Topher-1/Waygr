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

  it("shows a back-home link on live and post-accept views", () => {
    expect(clientSource).toMatch(/showHomeEscape/);
    expect(clientSource).toMatch(/view === "live"/);
    expect(clientSource).toMatch(/<Link[\s\S]*href="\/"/);
    expect(clientSource).toMatch(/copy\.live\.backHome/);
  });

  it("shows creator waiting view instead of accept CTAs", () => {
    expect(clientSource).toMatch(/view === "waiting"/);
    expect(clientSource).toMatch(/mode="waiting"/);
    expect(clientSource).toMatch(/copy\.create\.share/);
    expect(clientSource).toMatch(/copy\.home\.cancelCall/);
    const waitingFooter = clientSource.match(
      /view === "waiting" \? \([\s\S]*?\) : view === "open"/,
    )?.[0];
    expect(waitingFooter).toBeDefined();
    expect(waitingFooter).not.toMatch(/copy\.challenge\.accept/);
    expect(waitingFooter).not.toMatch(/handleImIn/);
    expect(waitingFooter).toMatch(/copy\.live\.backHome/);
    expect(waitingFooter).not.toMatch(/copy\.home\.makeCall/);
  });

  it("wires Not this one to navigate home", () => {
    expect(clientSource).toMatch(/function handleDecline/);
    expect(clientSource).toMatch(/handleDecline[\s\S]*router\.push\("\/"\)/);
    expect(clientSource).toMatch(/onClick=\{handleDecline\}/);
  });
});
