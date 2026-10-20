"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { updateCartItemAction, removeCartItemAction } from "@/lib/actions/cart";
import { formatPrice, discountedPrice } from "@/lib/format";

type CartItemData = {
  id: string;
  quantity: number;
  product: {
    slug: string;
    name: string;
    basePrice: number | string;
    discountPct: number;
    images: { url: string; altText: string | null }[];
  };
  variant: {
    size: string;
    color: string;
    stock: number;
    priceOverride: number | string | null;
  };
};

export function CartItemRow({ item }: { item: CartItemData }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const image = item.product.images[0];
  const unitPrice = item.variant.priceOverride
    ? Number(item.variant.priceOverride)
    : discountedPrice(Number(item.product.basePrice), item.product.discountPct);

  function handleQuantityChange(quantity: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCartItemAction({ cartItemId: item.id, quantity });
      if (result?.error) setError(result.error);
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeCartItemAction({ cartItemId: item.id });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex gap-4 border-b border-brand-cream-dark py-4">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-brand-cream-dark">
        {image && (
          <Image src={image.url} alt={image.altText ?? item.product.name} fill sizes="96px" className="object-cover" />
        )}
      </div>

      <div className="flex-1">
        <Link href={`/product/${item.product.slug}`} className="font-medium text-brand-ink hover:text-brand-gold">
          {item.product.name}
        </Link>
        <p className="mt-1 text-sm text-brand-ink-soft">
          Size {item.variant.size} · {item.variant.color}
        </p>
        <p className="mt-1 font-display text-brand-ink">{formatPrice(unitPrice)}</p>

        <div className="mt-2 flex items-center gap-3">
          <select
            value={item.quantity}
            disabled={isPending}
            onChange={(e) => handleQuantityChange(Number(e.target.value))}
            aria-label={`Quantity for ${item.product.name}`}
            className="rounded-md border border-brand-cream-dark px-2 py-1 text-sm"
          >
            {Array.from({ length: Math.min(10, item.variant.stock) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            aria-label={`Remove ${item.product.name} from cart`}
            className="flex items-center gap-1 text-sm text-brand-danger hover:underline"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-sm text-brand-danger">
            {error}
          </p>
        )}
      </div>

      <div className="font-display text-brand-ink">{formatPrice(unitPrice * item.quantity)}</div>
    </div>
  );
}
