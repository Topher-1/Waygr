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
