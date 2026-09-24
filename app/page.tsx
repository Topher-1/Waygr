import { getViewerProfile } from "@/lib/auth/profile";
import { getHomeFeed } from "@/lib/challenges/home-queries";
import { HomeClient } from "@/components/home/home-client";

export default async function HomePage() {
  const viewer = await getViewerProfile();
  const feed = viewer ? await getHomeFeed(viewer) : null;

  return <HomeClient viewer={viewer} feed={feed} />;
}
