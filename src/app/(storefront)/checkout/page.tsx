import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCartWithItems } from "@/lib/data/cart";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { discountedPrice } from "@/lib/format";
import { calculateShipping } from "@/lib/shipping/calculate";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  const [cart, addresses] = await Promise.all([
    getCartWithItems(session.user.id),
    prisma.address.findMany({ where: { userId: session.user.id }, orderBy: { isDefault: "desc" } }),
  ]);

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const unitPrice = item.variant.priceOverride
      ? Number(item.variant.priceOverride)
      : discountedPrice(Number(item.product.basePrice), item.product.discountPct);
    return sum + unitPrice * item.quantity;
  }, 0);

  const { charge: shippingCharge, estimatedDays } = await calculateShipping(subtotal);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-brand-ink">Checkout</h1>
      <div className="mt-6">
        <CheckoutClient
          addresses={addresses}
          subtotal={subtotal}
          shippingCharge={shippingCharge}
          estimatedDays={estimatedDays}
        />
      </div>
    </div>
  );
}
