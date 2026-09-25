import { describe, expect, it } from "vitest";
import { isGameOpenable, isGameTerminal } from "@/lib/games/openable";

describe("game openable helpers", () => {
  it("treats scheduled and live as openable", () => {
    expect(isGameOpenable("scheduled")).toBe(true);
    expect(isGameOpenable("live")).toBe(true);
  });

  it("treats final and canceled as terminal", () => {
    expect(isGameOpenable("final")).toBe(false);
    expect(isGameOpenable("canceled")).toBe(false);
    expect(isGameTerminal("final")).toBe(true);
    expect(isGameTerminal("live")).toBe(false);
  });
});
