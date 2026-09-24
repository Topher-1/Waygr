import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/constants";
import { tokens } from "@/lib/theme";

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
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
