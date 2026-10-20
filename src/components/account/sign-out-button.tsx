"use client";

import { useFormStatus } from "react-dom";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-brand-cream-dark px-5 py-2.5 text-sm font-semibold text-brand-ink hover:border-brand-danger hover:text-brand-danger disabled:opacity-50"
    >
      {pending ? "Signing out..." : "Sign Out"}
    </button>
  );
}
