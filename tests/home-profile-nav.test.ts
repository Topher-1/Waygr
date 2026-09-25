import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("home profile findability", () => {
  const homeSource = readFileSync(
    join(process.cwd(), "components/home/home-client.tsx"),
    "utf8",
  );

  it("links signed-in viewers to their profile from the header", () => {
    expect(homeSource).toMatch(/copy\.home\.viewProfile/);
    expect(homeSource).toMatch(/href=\{`\/u\/\$\{viewer\.handle\}`\}/);
  });

  it("links recent waygrs section to the full profile record", () => {
    expect(homeSource).toMatch(/feed\.settledWaygrs\.length > 0/);
    const settledSection = homeSource.match(
      /feed\.settledWaygrs\.length > 0[\s\S]*?feed\.openWaiting\.length > 0/,
    )?.[0];
    expect(settledSection).toBeDefined();
    expect(settledSection).toMatch(/copy\.home\.viewProfile/);
    expect(settledSection).toMatch(/href=\{`\/u\/\$\{viewer\.handle\}`\}/);
  });
});
