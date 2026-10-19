import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  if (!token || Array.isArray(token)) {
    redirect("/forgot-password");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl text-brand-ink">Set a New Password</h1>
      <div className="mt-8 rounded-xl border border-brand-cream-dark bg-white p-6">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
