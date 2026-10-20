import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/account/sign-out-button";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const [orderCount, addressCount] = await Promise.all([
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.address.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-brand-ink">My Account</h1>
      <p className="mt-1 text-brand-ink-soft">
        Welcome back, {session.user.name ?? session.user.email}.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="rounded-xl border border-brand-cream-dark bg-white p-6 hover:border-brand-gold"
        >
          <p className="font-display text-xl text-brand-ink">Orders</p>
          <p className="mt-1 text-sm text-brand-ink-soft">{orderCount} order(s)</p>
        </Link>
        <Link
          href="/account/addresses"
          className="rounded-xl border border-brand-cream-dark bg-white p-6 hover:border-brand-gold"
        >
          <p className="font-display text-xl text-brand-ink">Addresses</p>
          <p className="mt-1 text-sm text-brand-ink-soft">{addressCount} saved address(es)</p>
        </Link>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className="mt-8"
      >
        <SignOutButton />
      </form>
    </div>
  );
}
