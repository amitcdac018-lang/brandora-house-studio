"use client";

import { useEffect, useState, useTransition } from "react";
import { signInWithOtpAction } from "@/lib/actions/auth";
import { usePostLoginRedirect } from "./use-post-login-redirect";

type Step = "phone" | "code";

const RESEND_COOLDOWN_SECONDS = 30;

export function OtpLoginForm() {
  const { resumeAfterLogin } = usePostLoginRedirect();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function sendCode(onSuccess: () => void) {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "Could not send the code. Please try again.");
        return;
      }

      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      onSuccess();
    });
  }

  function handleSendCode(event?: React.FormEvent) {
    event?.preventDefault();
    sendCode(() => setStep("code"));
  }

  function handleResendCode() {
    setResendMessage(null);
    sendCode(() => setResendMessage("A new code has been sent."));
  }

  function handleVerifyCode(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    startTransition(async () => {
      const verifyResponse = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const verifyData = await verifyResponse.json().catch(() => null);

      if (!verifyResponse.ok) {
        setError(verifyData?.error ?? "Could not verify the code. Please try again.");
        return;
      }

      const result = await signInWithOtpAction({ phone, ticket: verifyData.ticket });

      if (result?.error) {
        setError(result.error);
        return;
      }

      await resumeAfterLogin();
    });
  }

  if (step === "phone") {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label htmlFor="otp-phone" className="block text-sm font-medium text-brand-ink">
            Phone Number
          </label>
          <input
            id="otp-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-brand-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !phone}
          className="w-full rounded-md bg-brand-ink py-2.5 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
        >
          {isPending ? "Sending..." : "Send OTP"}
        </button>

        {error && (
          <p className="text-center text-xs text-brand-ink-soft">
            Having trouble? Use email &amp; password sign-in instead.
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      <p className="text-sm text-brand-ink-soft">
        Enter the code sent to <span className="font-medium text-brand-ink">{phone}</span>.
      </p>

      <div>
        <label htmlFor="otp-code" className="block text-sm font-medium text-brand-ink">
          Verification Code
        </label>
        <input
          id="otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setResendMessage(null);
          }}
          className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm tracking-widest"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-brand-danger">
          {error}
        </p>
      )}

      {resendMessage && !error && (
        <p role="status" className="text-sm text-brand-success">
          {resendMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !code}
        className="w-full rounded-md bg-brand-ink py-2.5 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
      >
        {isPending ? "Verifying..." : "Verify & Sign In"}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={isPending || resendCooldown > 0}
          className="text-brand-gold hover:underline disabled:cursor-not-allowed disabled:text-brand-ink-soft/60 disabled:no-underline"
        >
          {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setError(null);
            setResendMessage(null);
            setResendCooldown(0);
          }}
          className="text-brand-ink-soft hover:text-brand-gold"
        >
          Use a different number
        </button>
      </div>
    </form>
  );
}
