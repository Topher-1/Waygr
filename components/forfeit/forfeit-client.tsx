"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import { BusyButton } from "@/components/ui/busy-button";
import { ChallengeShell } from "@/components/challenge/challenge-shell";
import {
  formatCall,
  formatForfeit,
  formatKickoff,
  formatMatchup,
} from "@/lib/challenges/format";
import { cardFileName, cardPath } from "@/lib/cards/content";
import { shareCardImage, shareCounts } from "@/lib/share/share-card";
import {
  hoursUntilAutoConfirm,
  MAX_PROOF_BYTES,
  PROOF_MIME_TYPES,
} from "@/lib/forfeits/actions";
import type { ChallengeLanding } from "@/lib/challenges/types";
import type { ForfeitKind, ForfeitStatus } from "@/lib/jobs/types";

export type ForfeitClientForfeit = {
  id: string;
  kind: ForfeitKind;
  status: ForfeitStatus;
  owedBy: string;
  owedTo: string;
  owedByName: string;
  owedToName: string;
  dueAt: string;
  paidAt: string | null;
  proofSubmittedAt: string | null;
  proofRejectedAt: string | null;
  challengeSlug: string;
};

type ForfeitClientProps = {
  forfeit: ForfeitClientForfeit;
  challenge: ChallengeLanding;
  role: "loser" | "winner";
  proofUrl: string | null;
};

export function ForfeitClient({
  forfeit,
  challenge,
  role,
  proofUrl,
}: ForfeitClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ForfeitStatus>(forfeit.status);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const busy = busyLabel !== null;
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const forfeitText = formatForfeit(challenge);

  async function handleShare(format: "post" | "story") {
    setBusyLabel(copy.forfeit.sharing);
    setError(null);
    setNote(copy.forfeit.sharing);

    const result = await shareCardImage({
      url: cardPath(forfeit.challengeSlug, "concession", format),
      fileName: cardFileName(forfeit.challengeSlug, "concession", format),
      title: copy.appName,
      text: copy.cards.owesLine(
        forfeit.owedByName,
        forfeit.owedToName,
        forfeitText,
      ),
    });

    if (!shareCounts(result)) {
      setBusyLabel(null);
      setNote(null);
      if (result === "failed") {
        setError(copy.forfeit.shareFailed);
      }
      return;
    }

    const res = await fetch(`/api/forfeits/${forfeit.id}/paid`, {
      method: "POST",
    });
    setBusyLabel(null);

    if (res.ok) {
      setStatus("proof_submitted");
      setNote(copy.forfeit.markedDone);
      router.refresh();
      return;
    }

    setNote(null);
    setError(copy.forfeit.shareFailed);
  }

  async function handleMarkDone() {
    setBusyLabel(copy.forfeit.markingDone);
    setError(null);
    const res = await fetch(`/api/forfeits/${forfeit.id}/paid`, {
      method: "POST",
    });
    setBusyLabel(null);

    if (res.ok) {
      setStatus("proof_submitted");
      setNote(copy.forfeit.markedDone);
      router.refresh();
      return;
    }

    setError(copy.forfeit.proofFailed);
  }

  async function handleProofFile(file: File) {
    setError(null);
    setNote(null);

    if (!(PROOF_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError(copy.forfeit.proofWrongType);
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      setError(copy.forfeit.proofTooBig);
      return;
    }

    setBusyLabel(copy.forfeit.uploadingProof);
    setNote(copy.forfeit.uploadingProof);

    const signRes = await fetch(`/api/forfeits/${forfeit.id}/proof`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "sign",
        contentType: file.type,
        size: file.size,
      }),
    });

    const signed = (await signRes.json()) as {
      ok?: boolean;
      uploadUrl?: string;
      path?: string;
      reason?: string;
    };

    if (!signRes.ok || !signed.ok || !signed.uploadUrl || !signed.path) {
      setBusyLabel(null);
      setNote(null);
      setError(
        signed.reason === "size"
          ? copy.forfeit.proofTooBig
          : signed.reason === "mime"
            ? copy.forfeit.proofWrongType
            : copy.forfeit.proofFailed,
      );
      return;
    }

    const upload = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type },
      body: file,
    }).catch(() => null);

    if (!upload?.ok) {
      setBusyLabel(null);
      setNote(null);
      setError(copy.forfeit.proofFailed);
      return;
    }

    const submit = await fetch(`/api/forfeits/${forfeit.id}/proof`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "submit", path: signed.path }),
    });

    setBusyLabel(null);

    if (!submit.ok) {
      setNote(null);
      setError(copy.forfeit.proofFailed);
      return;
    }

    setStatus("proof_submitted");
    setNote(copy.forfeit.proofSubmitted);
    router.refresh();
  }

  async function handleReview(action: "confirm" | "reject") {
    setBusyLabel(
      action === "confirm"
        ? copy.forfeit.confirmingProof
        : copy.forfeit.rejectingProof,
    );
    setError(null);
    const res = await fetch(`/api/forfeits/${forfeit.id}/${action}`, {
      method: "POST",
    });
    setBusyLabel(null);

    if (!res.ok) {
      setError(copy.forfeit.proofFailed);
      return;
    }

    setStatus(action === "confirm" ? "paid" : "owed");
    setNote(
      action === "confirm"
        ? copy.forfeit.proofConfirmed
        : copy.forfeit.proofRejected,
    );
    router.refresh();
  }

  const autoConfirmHours = forfeit.proofSubmittedAt
    ? hoursUntilAutoConfirm(forfeit.proofSubmittedAt, new Date())
    : null;

  return (
    <ChallengeShell>
      <section className="space-y-2">
        <h1 className="font-[family-name:var(--font-barlow)] text-3xl font-extrabold">
          {copy.forfeit.title}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {formatMatchup(challenge)} · {formatCall(challenge)}
        </p>
        <p className="text-lg">
          {role === "loser"
            ? copy.forfeit.owed(forfeit.owedToName)
            : copy.forfeit.owedBy(forfeit.owedByName)}
        </p>
        <p className="text-[var(--muted)]">{forfeitText}</p>
        {status !== "paid" ? (
          <p className="text-sm text-[var(--muted)]">
            {copy.forfeit.dueBy(formatKickoff(forfeit.dueAt))}
          </p>
        ) : null}
      </section>

      {status === "paid" ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--green)]">
          {copy.forfeit.paid}
        </p>
      ) : null}

      {note ? (
        <p role="status" className="text-sm text-[var(--muted)]">
          {note}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-[var(--rose)]">
          {error}
        </p>
      ) : null}

      {role === "loser" && status === "owed" ? (
        <section className="space-y-3">
          {forfeit.kind === "concession" ? (
            <>
              <BusyButton
                className="w-full"
                loading={busy}
                loadingLabel={busyLabel ?? copy.forfeit.sharing}
                disabled={busy}
                onClick={() => void handleShare("post")}
              >
                {copy.forfeit.shareConcession}
              </BusyButton>
              <BusyButton
                variant="secondary"
                className="w-full"
                loading={busy}
                loadingLabel={busyLabel ?? copy.forfeit.sharing}
                disabled={busy}
                onClick={() => void handleShare("story")}
              >
                {copy.forfeit.shareStory}
              </BusyButton>
            </>
          ) : null}

          {forfeit.kind === "custom" ? (
            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--muted)]">
                {copy.forfeit.proofHint}
              </p>
              <label
                className="block text-sm font-semibold"
                htmlFor="forfeit-proof"
              >
                {copy.forfeit.uploadProof}
              </label>
              <input
                id="forfeit-proof"
                type="file"
                accept={PROOF_MIME_TYPES.join(",")}
                disabled={busy || status !== "owed"}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleProofFile(file);
                }}
                className="block w-full rounded-lg border border-[var(--border)] bg-[var(--raised)] px-3 py-2 text-sm"
              />
              {forfeit.proofRejectedAt && status === "owed" ? (
                <p className="text-sm text-[var(--rose)]">
                  {copy.forfeit.proofRejected}
                </p>
              ) : null}
            </div>
          ) : null}

          {forfeit.kind === "concession" ? (
            <>
              <BusyButton
                variant="ghost"
                className="w-full"
                loading={busy}
                loadingLabel={busyLabel ?? copy.forfeit.markingDone}
                disabled={busy}
                onClick={() => void handleMarkDone()}
              >
                {copy.forfeit.markDone}
              </BusyButton>
              <p className="text-xs text-[var(--muted)]">
                {copy.forfeit.honorNote}
              </p>
            </>
          ) : null}
        </section>
      ) : null}

      {role === "loser" && status === "proof_submitted" ? (
        <p className="text-sm text-[var(--muted)]">
          {copy.forfeit.proofWaiting(forfeit.owedToName)}
          {autoConfirmHours !== null
            ? ` ${copy.forfeit.proofAutoConfirm(autoConfirmHours)}`
            : ""}
        </p>
      ) : null}

      {role === "winner" ? (
        <section className="space-y-3">
          {status === "proof_submitted" ? (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                {copy.forfeit.proofReview}
              </h2>
              {proofUrl ? (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-xl border border-[var(--border)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofUrl}
                    alt={`${forfeit.owedByName} — ${forfeitText}`}
                    className="w-full"
                  />
                </a>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  {copy.forfeit.honorMarkReview(forfeit.owedByName)}
                </p>
              )}
              <BusyButton
                className="w-full"
                loading={busy}
                loadingLabel={busyLabel ?? copy.forfeit.confirmingProof}
                disabled={busy}
                onClick={() => void handleReview("confirm")}
              >
                {copy.forfeit.confirmProof}
              </BusyButton>
              <BusyButton
                variant="secondary"
                className="w-full"
                loading={busy}
                loadingLabel={busyLabel ?? copy.forfeit.rejectingProof}
                disabled={busy}
                onClick={() => void handleReview("reject")}
              >
                {copy.forfeit.rejectProof}
              </BusyButton>
              {autoConfirmHours !== null ? (
                <p className="text-xs text-[var(--muted)]">
                  {copy.forfeit.proofAutoConfirm(autoConfirmHours)}
                </p>
              ) : null}
            </>
          ) : status === "owed" ? (
            <p className="text-sm text-[var(--muted)]">
              {copy.forfeit.owedBy(forfeit.owedByName)}
            </p>
          ) : null}
        </section>
      ) : null}

      <Link
        href={`/c/${forfeit.challengeSlug}`}
        className="text-sm text-[var(--muted)] underline-offset-2 hover:underline"
      >
        {formatMatchup(challenge)}
      </Link>
    </ChallengeShell>
  );
}
