"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { formatPrice, discountedPrice } from "@/lib/format";
import { addToCartAction } from "@/lib/actions/cart";
import { useCartUi } from "@/components/cart/cart-ui-context";

type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  basePrice: Prisma.Decimal | number | string;
  discountPct: number;
  avgRating: Prisma.Decimal | number | string;
  ratingCount: number;
  brand: { name: string };
  images: { url: string; altText: string | null }[];
  variants?: { id: string; stock: number }[];
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const router = useRouter();
  const { incrementItemCount, notify } = useCartUi();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"cart" | "buyNow" | null>(null);

  const image = product.images[0];
  const defaultVariant = product.variants?.find((v) => v.stock > 0);
  const inStock = product.variants ? product.variants.some((v) => v.stock > 0) : true;
  const finalPrice = discountedPrice(Number(product.basePrice), product.discountPct);

  function handleQuickAction(action: "cart" | "buyNow", event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!defaultVariant) return;

    setPendingAction(action);
    startTransition(async () => {
      const result = await addToCartAction({ productId: product.id, variantId: defaultVariant.id, quantity: 1 });
      if (result?.error) {
        if (result.code === "NOT_AUTHENTICATED") {
          router.push(`/login?callbackUrl=/product/${product.slug}`);
          return;
        }
        notify(result.error, "error");
        return;
      }
      incrementItemCount(1);
      if (action === "cart") {
        notify("Added to your bag", "success", { href: "/cart", label: "View Cart →" });
      } else {
        router.push("/checkout");
      }
    });
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-brand-cream-dark bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-cream-dark">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-brand-ink-soft/60">
            No image
          </div>
        )}
        {product.discountPct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-ink px-2.5 py-1 text-xs font-semibold text-brand-gold-soft">
            -{product.discountPct}%
          </span>
        )}
        {!inStock && (
          <span className="absolute right-3 top-3 rounded-full bg-brand-danger px-2.5 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-gold">{product.brand.name}</p>
        <h3 className="mt-1 truncate font-medium text-brand-ink">{product.name}</h3>

        <div className="mt-1 flex items-center gap-1 text-xs text-brand-ink-soft">
          <Star className="h-3.5 w-3.5 fill-brand-gold text-brand-gold" />
          <span>{Number(product.avgRating).toFixed(1)}</span>
          <span className="text-brand-ink-soft/60">({product.ratingCount})</span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-lg text-brand-ink">{formatPrice(finalPrice)}</span>
          {product.discountPct > 0 && (
            <span className="text-sm text-brand-ink-soft/60 line-through">
              {formatPrice(Number(product.basePrice))}
            </span>
          )}
        </div>

        {product.variants && (
          <div className="mt-3 flex gap-2" onClick={(e) => e.preventDefault()}>
            <button
              type="button"
              onClick={(e) => handleQuickAction("cart", e)}
              disabled={!inStock || isPending}
              className="flex-1 rounded-md border border-brand-ink py-2 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && pendingAction === "cart" ? "Adding..." : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={(e) => handleQuickAction("buyNow", e)}
              disabled={!inStock || isPending}
              className="flex-1 rounded-md bg-brand-ink py-2 text-xs font-semibold text-brand-gold-soft transition-colors hover:bg-brand-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && pendingAction === "buyNow" ? "..." : "Buy Now"}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
