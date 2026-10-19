import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AddressManager } from "@/components/account/address-manager";

export const metadata: Metadata = { title: "My Addresses" };

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/addresses");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-brand-ink">My Addresses</h1>
      <div className="mt-6">
        <AddressManager initialAddresses={addresses} />
      </div>
    </div>
  );
}
