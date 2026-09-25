import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getViewerProfile } from "@/lib/auth/profile";
import { getForfeitDetail, signProofUrl } from "@/lib/forfeits/queries";
import { resolveForfeitRole } from "@/lib/forfeits/actions";
import { ForfeitClient } from "@/components/forfeit/forfeit-client";
import { copy } from "@/lib/copy";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copy.forfeit.title,
  robots: { index: false, follow: false },
};

export default async function ForfeitPage({ params }: PageProps) {
  const { id } = await params;

  const viewer = await getViewerProfile();
  if (!viewer) {
    redirect(`/?next=${encodeURIComponent(`/f/${id}`)}`);
  }

  let detail;
  try {
    detail = await getForfeitDetail(id);
  } catch {
    notFound();
  }

  if (!detail) {
    notFound();
  }

  const role = resolveForfeitRole(detail, viewer.id);
  if (!role) {
    notFound();
  }

  const proofUrl =
    role === "winner" && detail.proofPath
      ? await signProofUrl(detail.proofPath).catch(() => null)
      : null;

  return (
    <ForfeitClient
      forfeit={{
        id: detail.id,
        kind: detail.kind,
        status: detail.status,
        owedBy: detail.owedBy,
        owedTo: detail.owedTo,
        owedByName: detail.owedByName,
        owedToName: detail.owedToName,
        dueAt: detail.dueAt,
        paidAt: detail.paidAt,
        proofSubmittedAt: detail.proofSubmittedAt,
        proofRejectedAt: detail.proofRejectedAt,
        challengeSlug: detail.challengeSlug,
      }}
      challenge={detail.challenge}
      role={role}
      proofUrl={proofUrl}
    />
  );
}
