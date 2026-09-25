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

  it("does not repeat the preview sentence as title and description", () => {
    const slug = "BzeiDEJ67P";
    const title = copy.challenge.preview(
      "totallykewl4u",
      "CHW wins",
      "a beer + a jersey swap + For Harboe!!",
    );
    const meta = challengePreviewMetadata(title, slug);

    expect(meta.metadataBase).toEqual(getMetadataBase());
    expect(meta.openGraph?.title).toBe(title);
    expect(meta.openGraph?.images).toEqual([challengeOgImage(slug)]);

    const descriptions = [
      meta.description,
      meta.openGraph?.description,
      meta.twitter &&
      typeof meta.twitter === "object" &&
      "description" in meta.twitter
        ? meta.twitter.description
        : undefined,
    ];

    for (const description of descriptions) {
      if (typeof description === "string") {
        expect(description).not.toBe(title);
      }
    }
  });
});
