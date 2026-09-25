import type { Metadata } from "next";
import { copy } from "@/lib/copy";

/** Public production origin — link previews and metadata must use this host. */
export const PRODUCTION_APP_ORIGIN = "https://waygr.vercel.app";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** metadataBase for Open Graph / Twitter cards (BUILD · link preview). */
export function getMetadataBase(): URL {
  if (process.env.NODE_ENV === "development") {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  }
  return new URL(PRODUCTION_APP_ORIGIN);
}

/** Challenge link-preview image path — .png suffix for picky crawlers (WhatsApp). */
export function challengeOgImagePath(slug: string): string {
  return `/c/${slug}/opengraph-image.png`;
}

export function challengeOgImage(slug: string) {
  return {
    url: challengeOgImagePath(slug),
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
    type: "image/png",
  };
}

/**
 * Challenge link tags.
 * iMessage prints og:title under the image, so the title is the pick only.
 * Description is a short CTA — Slack and WhatsApp show it, and it must not
 * repeat the stake already drawn on the card. `null` is not enough: Next
 * will refill an empty description from the title.
 */
export function challengePreviewMetadata(title: string, slug: string): Metadata {
  const ogImage = challengeOgImage(slug);
  const description = copy.challenge.previewShareDescription;

  return {
    metadataBase: getMetadataBase(),
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}
