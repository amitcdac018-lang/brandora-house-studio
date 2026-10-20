"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";
import { OtpLoginForm } from "./otp-login-form";

type Tab = "email" | "phone";

export function LoginTabs() {
  const [tab, setTab] = useState<Tab>("email");

  return (
    <div>
      <div className="mb-6 flex rounded-md border border-brand-cream-dark p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`flex-1 rounded px-3 py-2 transition-colors ${
            tab === "email" ? "bg-brand-ink text-brand-gold-soft" : "text-brand-ink-soft hover:text-brand-ink"
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setTab("phone")}
          className={`flex-1 rounded px-3 py-2 transition-colors ${
            tab === "phone" ? "bg-brand-ink text-brand-gold-soft" : "text-brand-ink-soft hover:text-brand-ink"
          }`}
        >
          Phone / OTP
        </button>
      </div>

      {tab === "email" ? <LoginForm /> : <OtpLoginForm />}
    </div>
  );
}
