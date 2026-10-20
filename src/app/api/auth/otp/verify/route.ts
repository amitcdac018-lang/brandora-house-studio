import { NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validations/auth";
import { checkOtp, toE164 } from "@/lib/otp/twilio-verify";
import { issueVerificationTicket } from "@/lib/otp/verification-ticket";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = await rateLimit(`otp-verify:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the code you received." }, { status: 400 });
  }

  const e164Phone = toE164(parsed.data.phone);
  if (!e164Phone) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }

  const phoneRate = await rateLimit(`otp-verify-phone:${e164Phone}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!phoneRate.success) {
    return NextResponse.json({ error: "Too many attempts for this number. Please try again later." }, { status: 429 });
  }

  try {
    const result = await checkOtp(e164Phone, parsed.data.code);

    if (result === "expired") {
      return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });
    }
    if (result === "denied") {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    const ticket = issueVerificationTicket(e164Phone);
    return NextResponse.json({ ok: true, ticket });
  } catch {
    return NextResponse.json({ error: "Could not verify the code. Please try again." }, { status: 502 });
  }
}
