"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";
import { OtpLoginForm } from "./otp-login-form";

type Tab = "phone" | "email";

export function LoginTabs() {
  const [tab, setTab] = useState<Tab>("phone");

  return (
    <div>
      <div className="mb-6 flex rounded-md border border-brand-cream-dark p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab("phone")}
          className={`flex-1 rounded px-3 py-2 transition-colors ${
            tab === "phone" ? "bg-brand-ink text-brand-gold-soft" : "text-brand-ink-soft hover:text-brand-ink"
          }`}
        >
          Phone / OTP
        </button>
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`flex-1 rounded px-3 py-2 transition-colors ${
            tab === "email" ? "bg-brand-ink text-brand-gold-soft" : "text-brand-ink-soft hover:text-brand-ink"
          }`}
        >
          Email
        </button>
      </div>

      {/* Fixed min-height reserved for the tallest form/step (LoginForm) so switching
          tabs — or the OTP form's phone->code step — never visibly resizes the card.
          Without this the page's vertical centering (see login/page.tsx) turns every
          height change into a jarring jump of the whole box up/down the screen. */}
      <div className="min-h-84">{tab === "phone" ? <OtpLoginForm /> : <LoginForm />}</div>
    </div>
  );
}
