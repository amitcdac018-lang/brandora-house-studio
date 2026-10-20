import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { toE164 } from "@/lib/otp/twilio-verify";
import { verifyTicket } from "@/lib/otp/verification-ticket";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    Credentials({
      id: "otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        ticket: { label: "Ticket", type: "text" },
      },
      async authorize(credentials) {
        const phone = typeof credentials?.phone === "string" ? credentials.phone : null;
        const ticket = typeof credentials?.ticket === "string" ? credentials.ticket : null;
        if (!phone || !ticket) return null;

        const e164Phone = toE164(phone);
        if (!e164Phone) return null;

        // The ticket proves this phone's OTP was already checked against Twilio (with
        // Twilio's own attempt/expiry limits) in /api/auth/otp/verify — never re-check the
        // raw code here, since this authorize() call has no rate limiting of its own.
        if (!verifyTicket(e164Phone, ticket)) return null;

        let user = await prisma.user.findUnique({ where: { phone: e164Phone } });
        if (!user) {
          user = await prisma.user.create({
            data: { phone: e164Phone, phoneVerified: new Date(), role: "CUSTOMER" },
          });
        } else if (!user.phoneVerified) {
          user = await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: new Date() } });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "ADMIN";
      }
      return session;
    },
  },
  trustHost: true,
};
