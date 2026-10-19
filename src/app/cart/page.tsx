import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCartWithItems } from "@/lib/data/cart";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { formatPrice, discountedPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Your Cart" };

export default async function CartPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl text-brand-ink">Your cart is waiting</h1>
        <p className="mt-2 text-brand-ink-soft">Sign in to view your cart and continue shopping.</p>
        <Link
          href="/login?callbackUrl=/cart"
          className="mt-6 inline-block rounded-md bg-brand-ink px-6 py-3 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const cart = await getCartWithItems(session.user.id);
  const items = cart?.items ?? [];

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.variant.priceOverride
      ? Number(item.variant.priceOverride)
      : discountedPrice(Number(item.product.basePrice), item.product.discountPct);
    return sum + unitPrice * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl text-brand-ink">Your cart is empty</h1>
        <p className="mt-2 text-brand-ink-soft">Browse our collection and find your next favorite pair.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-brand-ink px-6 py-3 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-brand-ink">Your Cart</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={{
                id: item.id,
                quantity: item.quantity,
                product: {
                  slug: item.product.slug,
                  name: item.product.name,
                  basePrice: Number(item.product.basePrice),
                  discountPct: item.product.discountPct,
                  images: item.product.images,
                },
                variant: {
                  size: item.variant.size,
                  color: item.variant.color,
                  stock: item.variant.stock,
                  priceOverride: item.variant.priceOverride ? Number(item.variant.priceOverride) : null,
                },
              }}
            />
          ))}
        </div>

        <div className="h-fit rounded-xl border border-brand-cream-dark bg-white p-6">
          <h2 className="font-display text-lg text-brand-ink">Order Summary</h2>
          <div className="mt-4 flex justify-between text-sm text-brand-ink-soft">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-brand-ink-soft/70">Shipping and taxes calculated at checkout.</p>
          <Link
            href="/checkout"
            className="mt-6 block rounded-md bg-brand-ink py-3 text-center text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
