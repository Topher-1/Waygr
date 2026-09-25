import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChallengeClient } from "@/components/challenge/challenge-client";
import { getChallengeBySlug } from "@/lib/challenges/queries";
import { resolveChallengeView } from "@/lib/challenges/views";
import { formatCall, formatForfeit } from "@/lib/challenges/format";
import { getViewerProfile } from "@/lib/auth/profile";
import { getForfeitForChallenge } from "@/lib/forfeits/queries";
import { copy } from "@/lib/copy";
import { challengeOgImage, getMetadataBase } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const challenge = await getChallengeBySlug(slug);
    if (!challenge) {
      return { title: "Challenge not found" };
    }

    const call = formatCall(challenge);
    const forfeit = formatForfeit(challenge);
    const title = copy.challenge.preview(
      challenge.creator.displayName,
      call,
      forfeit,
    );
    const ogImage = challengeOgImage(slug);

    return {
      metadataBase: getMetadataBase(),
      title,
      description: title,
      openGraph: {
        title,
        description: title,
        images: [ogImage],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: title,
        images: [ogImage.url],
      },
    };
  } catch {
    return { title: "Challenge" };
  }
}

export default async function ChallengePage({ params }: PageProps) {
  const { slug } = await params;

  let challenge;
  try {
    challenge = await getChallengeBySlug(slug);
  } catch {
    notFound();
  }

  if (!challenge) {
    notFound();
  }

  const viewer = await getViewerProfile();
  const view = resolveChallengeView(challenge, viewer?.id ?? null);

  // The settled view needs the forfeit to offer the forfeit action (BUILD · Challenge).
  const isParticipant =
    viewer !== null &&
    (viewer.id === challenge.creator.id || viewer.id === challenge.opponent?.id);

  const forfeit =
    view === "settled" && isParticipant
      ? await getForfeitForChallenge(challenge.id).catch(() => null)
      : null;

  return (
    <ChallengeClient
      challenge={challenge}
      view={view}
      viewer={viewer}
      forfeit={
        forfeit
          ? {
              id: forfeit.id,
              kind: forfeit.kind,
              status: forfeit.status,
              owedBy: forfeit.owedBy,
              owedTo: forfeit.owedTo,
            }
          : null
      }
    />
  );
}
