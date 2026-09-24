import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChallengeClient } from "@/components/challenge/challenge-client";
import { getChallengeBySlug } from "@/lib/challenges/queries";
import { resolveChallengeView } from "@/lib/challenges/views";
import { formatCall, formatForfeit } from "@/lib/challenges/format";
import { getViewerProfile } from "@/lib/auth/profile";
import { copy } from "@/lib/copy";

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    return {
      title,
      description: title,
      openGraph: {
        title,
        description: title,
        images: [`${appUrl}/c/${slug}/opengraph-image`],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: title,
        images: [`${appUrl}/c/${slug}/opengraph-image`],
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

  return (
    <ChallengeClient challenge={challenge} view={view} viewer={viewer} />
  );
}
