"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithOtpAction } from "@/lib/actions/auth";

type Step = "phone" | "code";

export function OtpLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSendCode() {
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

      setStep("code");
    });
  }

  function handleVerifyCode() {
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

      router.push(callbackUrl);
      router.refresh();
    });
  }

  if (step === "phone") {
    return (
      <div className="space-y-4">
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
          type="button"
          onClick={handleSendCode}
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          onChange={(e) => setCode(e.target.value)}
          className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm tracking-widest"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-brand-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleVerifyCode}
        disabled={isPending || !code}
        className="w-full rounded-md bg-brand-ink py-2.5 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
      >
        {isPending ? "Verifying..." : "Verify & Sign In"}
      </button>

      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setCode("");
          setError(null);
        }}
        className="w-full text-sm text-brand-ink-soft hover:text-brand-gold"
      >
        Use a different number
      </button>
    </div>
  );
}
