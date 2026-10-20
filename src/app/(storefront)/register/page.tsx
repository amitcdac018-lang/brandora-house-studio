import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl text-brand-ink">Join Brandora House Studio</h1>
      <p className="mt-1 text-sm text-brand-ink-soft">Create an account to start shopping.</p>
      <div className="mt-8 rounded-xl border border-brand-cream-dark bg-white p-6">
        <RegisterForm />
      </div>
    </div>
  );
}
