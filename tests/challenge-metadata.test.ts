import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copy } from "@/lib/copy";
import {
  PRODUCTION_APP_ORIGIN,
  challengeOgImage,
  challengeOgImagePath,
  challengePreviewMetadata,
  getMetadataBase,
} from "@/lib/metadata";

describe("challenge link preview metadata", () => {
  it("uses the public production origin in production builds", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(getMetadataBase().origin).toBe(PRODUCTION_APP_ORIGIN);
    process.env.NODE_ENV = previous;
  });

  it("uses local app URL in development", () => {
    const previous = process.env.NODE_ENV;
    const previousUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(getMetadataBase().origin).toBe("http://localhost:3000");
    process.env.NODE_ENV = previous;
    process.env.NEXT_PUBLIC_APP_URL = previousUrl;
  });

  it("advertises a .png challenge OG image with dimensions and type", () => {
    const slug = "qdiAGDQuF8";
    expect(challengeOgImagePath(slug)).toBe(`/c/${slug}/opengraph-image.png`);
    expect(challengeOgImage(slug)).toEqual({
      url: `/c/${slug}/opengraph-image.png`,
      width: 1200,
      height: 630,
      type: "image/png",
    });
  });

  it("keeps the stake off the title and description iMessage prints under the card", () => {
    const slug = "BzeiDEJ67P";
    const name = "totallykewl4u";
    const call = "CLE wins";
    const forfeit = "owes a beer + garlic bread";
    const title = copy.challenge.previewShareTitle(name, call);
    const full = copy.challenge.preview(name, call, forfeit);
    const meta = challengePreviewMetadata(title, slug);

    expect(meta.metadataBase).toEqual(getMetadataBase());
    expect(meta.title).toBe("totallykewl4u says CLE wins");
    expect(meta.openGraph?.title).toBe(title);
    expect(meta.openGraph?.images).toEqual([challengeOgImage(slug)]);
    expect(meta.description).toBe(copy.challenge.previewShareDescription);
    expect(meta.openGraph?.description).toBe(copy.challenge.previewShareDescription);

    const fields = [
      meta.title,
      meta.description,
      meta.openGraph?.title,
      meta.openGraph?.description,
      meta.twitter && typeof meta.twitter === "object" && "title" in meta.twitter
        ? meta.twitter.title
        : undefined,
      meta.twitter &&
      typeof meta.twitter === "object" &&
      "description" in meta.twitter
        ? meta.twitter.description
        : undefined,
    ];

    for (const field of fields) {
      expect(field).not.toBe(full);
      expect(String(field)).not.toContain("Loser");
      expect(String(field)).not.toContain("garlic bread");
    }

    expect(meta.description).not.toBe(meta.openGraph?.title);
  });

  it("wires the challenge page to the short share title", () => {
    const src = readFileSync(
      join(process.cwd(), "app/c/[slug]/page.tsx"),
      "utf8",
    );
    expect(src).toContain("previewShareTitle");
    expect(src).not.toContain("copy.challenge.preview(");
  });
});
