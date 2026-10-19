import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl text-brand-ink">Reset Your Password</h1>
      <p className="mt-1 text-sm text-brand-ink-soft">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <div className="mt-8 rounded-xl border border-brand-cream-dark bg-white p-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
