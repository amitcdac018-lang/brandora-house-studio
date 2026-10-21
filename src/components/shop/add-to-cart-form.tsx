"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/lib/actions/cart";
import { useCartUi } from "@/components/cart/cart-ui-context";

type Variant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

export function AddToCartForm({
  productId,
  productSlug,
  variants,
}: {
  productId: string;
  productSlug: string;
  variants: Variant[];
}) {
  const router = useRouter();
  const { incrementItemCount, notify } = useCartUi();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"cart" | "buyNow" | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size))), [variants]);
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);

  const colorsForSize = useMemo(
    () => variants.filter((v) => v.size === selectedSize),
    [variants, selectedSize]
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(colorsForSize[0]?.color ?? null);

  const selectedVariant = variants.find((v) => v.size === selectedSize && v.color === selectedColor);

  function handleSizeChange(size: string) {
    setSelectedSize(size);
    const firstColor = variants.find((v) => v.size === size);
    setSelectedColor(firstColor?.color ?? null);
    setMessage(null);
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    setMessage(null);
    setPendingAction("cart");
    startTransition(async () => {
      const result = await addToCartAction({ productId, variantId: selectedVariant.id, quantity: 1 });
      if (result?.error) {
        if (result.error.includes("sign")) {
          router.push("/login");
          return;
        }
        setMessage({ type: "error", text: result.error });
        notify(result.error, "error");
      } else {
        setMessage({ type: "success", text: "Added to cart." });
        incrementItemCount(1);
        notify("Added to your bag", "success", { href: "/cart", label: "View Cart →" });
      }
    });
  }

  function handleBuyNow() {
    if (!selectedVariant) return;
    setMessage(null);
    setPendingAction("buyNow");
    startTransition(async () => {
      const result = await addToCartAction({ productId, variantId: selectedVariant.id, quantity: 1 });
      if (result?.error) {
        if (result.error.includes("sign")) {
          router.push("/login?callbackUrl=/product/" + productSlug);
          return;
        }
        setMessage({ type: "error", text: result.error });
        notify(result.error, "error");
        return;
      }
      incrementItemCount(1);
      router.push("/checkout");
    });
  }

  const outOfStock = !selectedVariant || selectedVariant.stock === 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-brand-ink">Size</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizeChange(size)}
              className={`h-10 min-w-10 rounded-md border px-3 text-sm ${
                selectedSize === size
                  ? "border-brand-ink bg-brand-ink text-brand-gold-soft"
                  : "border-brand-cream-dark text-brand-ink-soft hover:border-brand-gold"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-brand-ink">Color</p>
        <div className="flex flex-wrap gap-2">
          {colorsForSize.map((v) => (
            <button
              key={v.color}
              type="button"
              onClick={() => setSelectedColor(v.color)}
              className={`rounded-md border px-3 py-2 text-sm ${
                selectedColor === v.color
                  ? "border-brand-ink bg-brand-ink text-brand-gold-soft"
                  : "border-brand-cream-dark text-brand-ink-soft hover:border-brand-gold"
              }`}
            >
              {v.color}
            </button>
          ))}
        </div>
      </div>

      {selectedVariant && (
        <p className="text-sm text-brand-ink-soft">
          {selectedVariant.stock > 0
            ? selectedVariant.stock <= 5
              ? `Only ${selectedVariant.stock} left in stock`
              : "In stock"
            : "Out of stock"}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock || isPending}
          className="w-full rounded-md border border-brand-ink bg-white py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && pendingAction === "cart" ? "Adding..." : outOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock || isPending}
          className="w-full rounded-md bg-brand-ink py-3 text-sm font-semibold text-brand-gold-soft transition-colors hover:bg-brand-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && pendingAction === "buyNow" ? "Processing..." : outOfStock ? "Out of Stock" : "Buy Now"}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`text-sm ${message.type === "error" ? "text-brand-danger" : "text-brand-success"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
