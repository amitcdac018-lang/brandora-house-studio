import { NextResponse } from "next/server";
import { sendOtpSchema } from "@/lib/validations/auth";
import { sendOtp, toE164, OtpSendConfigError } from "@/lib/otp/twilio-verify";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // Keyed by IP only (no account exists yet at this point) — tight limit since each call
  // costs a real SMS send via Twilio.
  const { success } = await rateLimit(`otp-send:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  const e164Phone = toE164(parsed.data.phone);
  if (!e164Phone) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }

  // Also rate-limit per phone number so one number can't be spammed from many IPs.
  const phoneRate = await rateLimit(`otp-send-phone:${e164Phone}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!phoneRate.success) {
    return NextResponse.json({ error: "Too many attempts for this number. Please try again later." }, { status: 429 });
  }

  try {
    await sendOtp(e164Phone);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OtpSendConfigError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Could not send the code. Please try again." }, { status: 502 });
  }
}
