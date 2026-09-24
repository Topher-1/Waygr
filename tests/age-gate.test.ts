import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copy } from "@/lib/copy";

describe("age gate copy", () => {
  it("requires 21+ in the adult checkbox", () => {
    expect(copy.auth.adultCheckbox).toMatch(/21/);
    expect(copy.auth.adultCheckbox).not.toMatch(/\b18\b/);
  });

  it("sign-in sheet uses 21+ error from copy, not hardcoded 18", () => {
    const source = readFileSync(
      join(process.cwd(), "components/auth/sign-in-sheet.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/18 or older/);
    expect(source).toContain("copy.auth.adultConfirmError");
  });

  it("create sheet uses 21+ error from copy, not hardcoded 18", () => {
    const source = readFileSync(
      join(process.cwd(), "components/create/create-sheet.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/18\+/);
    expect(source).toContain("copy.auth.adultConfirmError");
  });
});
