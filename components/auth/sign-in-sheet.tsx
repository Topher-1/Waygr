"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth/errors";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { BusyButton } from "@/components/ui/busy-button";

type SignInSheetProps = {
  open: boolean;
  onClose: () => void;
  mode: "sign-in" | "adult-only";
  onComplete: () => void;
};

type Step = "credentials" | "adult";

export function SignInSheet({
  open,
  onClose,
  mode,
  onComplete,
}: SignInSheetProps) {
  const [step, setStep] = useState<Step>(
    mode === "adult-only" ? "adult" : "credentials",
  );
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adultChecked, setAdultChecked] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(mode === "adult-only" ? "adult" : "credentials");
      setError(null);
    }
  }, [open, mode]);

  if (!open) {
    return null;
  }

  const supabase = createClient();

  async function setupProfile(): Promise<boolean> {
    const res = await fetch("/api/auth/setup-profile", { method: "POST" });
    if (!res.ok) {
      setError("Could not set up your profile. Try again.");
      return false;
    }
    const body = (await res.json()) as {
      profile?: { adultConfirmedAt: string | null };
    };
    return !body.profile?.adultConfirmedAt;
  }

  async function persistAdultConfirmation(): Promise<boolean> {
    const res = await fetch("/api/auth/confirm-adult", { method: "POST" });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Could not confirm age.");
      return false;
    }
    return true;
  }

  async function handleCredentials() {
    if (authMode === "sign-up" && !adultChecked) {
      setError(copy.auth.adultConfirmError);
      return;
    }

    setLoading(true);
    setError(null);

    const result =
      authMode === "sign-up"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setLoading(false);
      const mapped = mapAuthError(result.error.message);
      if (mapped.suggestSignIn) {
        setError(copy.auth.alreadyRegistered);
        setAuthMode("sign-in");
        return;
      }
      setError(mapped.text);
      return;
    }

    if (authMode === "sign-up" && result.data.user && !result.data.session) {
      setLoading(false);
      setError("Check your email to confirm your account, then sign in.");
      setAuthMode("sign-in");
      return;
    }

    const needsAdult = await setupProfile();
    if (needsAdult) {
      if (authMode === "sign-up" && adultChecked) {
        const confirmed = await persistAdultConfirmation();
        setLoading(false);
        if (!confirmed) {
          return;
        }
        onComplete();
        onClose();
        return;
      }
      setLoading(false);
      setStep("adult");
      return;
    }

    setLoading(false);
    onComplete();
    onClose();
  }

  async function confirmAdult() {
    if (!adultChecked) {
      setError(copy.auth.adultConfirmError);
      return;
    }
    setLoading(true);
    setError(null);
    const confirmed = await persistAdultConfirmation();
    setLoading(false);
    if (!confirmed) {
      return;
    }
    onComplete();
    onClose();
  }

  async function handleSignOutFromAdult() {
    setLoading(true);
    setError(null);
    await supabase.auth.signOut();
    setLoading(false);
    setStep("credentials");
    setAuthMode("sign-in");
    setAdultChecked(false);
    setError(copy.auth.adultAbandonMessage);
  }

  async function handleClose() {
    if (step === "adult") {
      await handleSignOutFromAdult();
      return;
    }
    onClose();
  }

  const credentialsReady =
    email.length > 0 &&
    password.length >= 8 &&
    (authMode === "sign-in" || adultChecked);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-barlow)] text-xl font-bold">
            {step === "adult"
              ? copy.auth.adultStepTitle
              : authMode === "sign-up"
                ? copy.auth.signUpTitle
                : copy.auth.signInTitle}
          </h2>
          <button
            type="button"
            onClick={() => void handleClose()}
            disabled={loading}
            className="text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error ? (
          <p className="mb-3 text-sm text-[var(--rose)]" role="alert">
            {error}
          </p>
        ) : null}

        {step === "credentials" && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void handleCredentials();
            }}
          >
            <label className="text-sm text-[var(--muted)]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3 text-[var(--text)]"
            />
            <label className="text-sm text-[var(--muted)]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                authMode === "sign-up" ? "new-password" : "current-password"
              }
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3 text-[var(--text)]"
            />
            {authMode === "sign-up" ? (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={adultChecked}
                  onChange={(e) => setAdultChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[var(--orange)]"
                />
                <span>{copy.auth.adultCheckbox}</span>
              </label>
            ) : null}
            <BusyButton
              type="submit"
              disabled={!credentialsReady}
              loading={loading}
              loadingLabel={
                authMode === "sign-up" ? copy.auth.signingUp : copy.auth.signingIn
              }
            >
              {authMode === "sign-up" ? copy.auth.signUp : copy.auth.signIn}
            </BusyButton>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => {
                setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in");
                setError(null);
              }}
            >
              {authMode === "sign-in"
                ? copy.auth.needAccount
                : copy.auth.haveAccount}
            </Button>
            <p className="text-center text-xs text-[var(--muted)]">
              {copy.auth.termsNote}
            </p>
          </form>
        )}

        {step === "adult" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--muted)]">
              {copy.auth.adultPendingHint}
            </p>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={adultChecked}
                onChange={(e) => setAdultChecked(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--orange)]"
              />
              <span>{copy.auth.adultCheckbox}</span>
            </label>
            <BusyButton
              onClick={() => void confirmAdult()}
              loading={loading}
              loadingLabel={copy.auth.working}
            >
              Continue
            </BusyButton>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => void handleSignOutFromAdult()}
            >
              {copy.auth.signOut}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
