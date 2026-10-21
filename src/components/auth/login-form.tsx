"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInAction } from "@/lib/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signInAction({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-brand-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-brand-ink">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
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
        disabled={isPending}
        className="w-full rounded-md bg-brand-ink py-2.5 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>

      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-brand-ink-soft hover:text-brand-gold">
          Forgot password?
        </Link>
        <Link
          href={
            searchParams.get("callbackUrl")
              ? `/register?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}`
              : "/register"
          }
          className="text-brand-ink-soft hover:text-brand-gold"
        >
          Create an account
        </Link>
      </div>
    </form>
  );
}
