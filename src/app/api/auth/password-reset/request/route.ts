import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requestPasswordResetSchema } from "@/lib/validations/auth";
import { generateRawToken, hashToken } from "@/lib/security/tokens";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = await rateLimit(`pwreset:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way to avoid leaking account existence.
  if (user) {
    const rawToken = generateRawToken();
    await prisma.passwordResetToken.create({
      data: {
        token: hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    // TODO: wire up an email provider to send the reset link containing rawToken.
    // Never log or return rawToken in the API response.
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] Password reset token for ${email}: ${rawToken}`);
    }
  }

  return NextResponse.json({ ok: true });
}
