"use server";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function signInAction(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await rateLimit(`login:${ip}:${parsed.data.email}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!success) {
    return { error: "Too many attempts. Please try again later." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch {
    return { error: "Invalid email or password." };
  }
}

export async function signInWithOtpAction(input: { phone: string; ticket: string }) {
  try {
    await signIn("otp", {
      phone: input.phone,
      ticket: input.ticket,
      redirect: false,
    });
    return { ok: true };
  } catch {
    return { error: "Could not sign you in. Please request a new code and try again." };
  }
}

export async function signOutAction() {
  // redirect: false — the client navigates to /login itself after this resolves, so the
  // session cookie is cleared first and the browser isn't mid-redirect when it does.
  await signOut({ redirect: false });
}
