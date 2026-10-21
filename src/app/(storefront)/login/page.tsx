import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { toSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { LoginTabs } from "@/components/auth/login-tabs";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) {
    const resolvedSearchParams = await searchParams;
    const rawCallbackUrl = typeof resolvedSearchParams.callbackUrl === "string" ? resolvedSearchParams.callbackUrl : null;
    redirect(toSafeRedirectPath(rawCallbackUrl));
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl text-brand-ink">Welcome Back</h1>
      <p className="mt-1 text-sm text-brand-ink-soft">Sign in to continue to Brandora House Studio.</p>
      <div className="mt-8 rounded-xl border border-brand-cream-dark bg-white p-6">
        <Suspense fallback={null}>
          <LoginTabs />
        </Suspense>
      </div>
    </div>
  );
}
