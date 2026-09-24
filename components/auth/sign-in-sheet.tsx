"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { APPLE_SIGN_IN_ENABLED, authCallbackUrl } from "@/lib/auth/providers";

type SignInSheetProps = {
  open: boolean;
  onClose: () => void;
  onSignedIn: () => void;
  nextPath: string;
  mode: "sign-in" | "adult-only";
  onAdultConfirmed: () => void;
};

type Step = "providers" | "phone" | "adult";

export function SignInSheet({
  open,
  onClose,
  onSignedIn,
  nextPath,
  mode,
  onAdultConfirmed,
}: SignInSheetProps) {
  const [step, setStep] = useState<Step>(
    mode === "adult-only" ? "adult" : "providers",
  );
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adultChecked, setAdultChecked] = useState(false);

  if (!open) {
    return null;
  }

  const supabase = createClient();
  const redirectTo = authCallbackUrl(nextPath);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  async function signInWithApple() {
    if (!APPLE_SIGN_IN_ENABLED) {
      setError("Sign in with Apple is coming soon. Use Google or phone for now.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  async function sendOtp() {
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setOtpSent(true);
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    onSignedIn();
    setStep("adult");
  }

  async function confirmAdult() {
    if (!adultChecked) {
      setError("Confirm you are 18 or older to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/confirm-adult", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Could not confirm age.");
      return;
    }
    onAdultConfirmed();
    onClose();
  }

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
            {step === "adult" ? "One more thing" : "Sign in"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error ? (
          <p className="mb-3 text-sm text-[var(--rose)]" role="alert">{error}</p>
        ) : null}

        {step === "providers" && (
          <div className="flex flex-col gap-3">
            <Button onClick={signInWithGoogle} disabled={loading}>
              Continue with Google
            </Button>
            <Button
              variant="secondary"
              onClick={() => setStep("phone")}
              disabled={loading}
            >
              Continue with phone
            </Button>
            <Button
              variant="secondary"
              onClick={signInWithApple}
              disabled={loading || !APPLE_SIGN_IN_ENABLED}
            >
              {APPLE_SIGN_IN_ENABLED
                ? "Continue with Apple"
                : "Apple (coming soon)"}
            </Button>
            <p className="text-center text-xs text-[var(--muted)]">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </div>
        )}

        {step === "phone" && (
          <div className="flex flex-col gap-3">
            {!otpSent ? (
              <>
                <label className="text-sm text-[var(--muted)]" htmlFor="phone">
                  Phone number (E.164, e.g. +15551234567)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3 text-[var(--text)]"
                  placeholder="+1..."
                />
                <Button onClick={sendOtp} disabled={loading || !phone}>
                  Send code
                </Button>
              </>
            ) : (
              <>
                <label className="text-sm text-[var(--muted)]" htmlFor="otp">
                  Enter the code we sent
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3 text-[var(--text)]"
                  placeholder="123456"
                />
                <Button onClick={verifyOtp} disabled={loading || !otp}>
                  Verify
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setStep("providers")}>
              Back
            </Button>
          </div>
        )}

        {step === "adult" && (
          <div className="flex flex-col gap-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={adultChecked}
                onChange={(e) => setAdultChecked(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--orange)]"
              />
              <span>{copy.auth.adultCheckbox}</span>
            </label>
            <Button onClick={confirmAdult} disabled={loading}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
