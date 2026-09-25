import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/constants";
import { tokens } from "@/lib/theme";

/** Icons come from the Designer pack (docs/brand/ → public/icons). */
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Call your shot against a friend on a live game.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: tokens.dark.bg,
    theme_color: tokens.dark.bg,
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      ...ICON_SIZES.map((size) => ({
        src: `/icons/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "any" as const,
      })),
      {
        src: "/icons/icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
