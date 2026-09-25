"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { BusyButton } from "@/components/ui/busy-button";

type CancelCallSheetProps = {
  open: boolean;
  matchup: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function CancelCallSheet({
  open,
  matchup,
  onClose,
  onConfirm,
}: CancelCallSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError(copy.home.cancelCallError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-call-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h2
          id="cancel-call-title"
          className="mb-2 font-[family-name:var(--font-barlow)] text-xl font-bold"
        >
          {copy.home.cancelCallTitle}
        </h2>
        <p className="mb-1 text-sm font-semibold text-[var(--text)]">
          {matchup}
        </p>
        <p className="mb-6 text-sm text-[var(--muted)]">
          {copy.home.cancelCallBody}
        </p>

        {error ? (
          <p className="mb-4 text-sm text-[var(--rose)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <BusyButton
            variant="primary"
            className="w-full"
            loading={loading}
            loadingLabel={copy.home.cancelCallWorking}
            onClick={() => void handleConfirm()}
          >
            {copy.home.cancelCallConfirm}
          </BusyButton>
          <Button
            variant="secondary"
            className="w-full"
            disabled={loading}
            onClick={onClose}
          >
            {copy.home.cancelCallKeep}
          </Button>
        </div>
      </div>
    </div>
  );
}
