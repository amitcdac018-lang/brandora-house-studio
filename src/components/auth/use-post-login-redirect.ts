"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addToCartAction } from "@/lib/actions/cart";
import { useCartUi } from "@/components/cart/cart-ui-context";

/**
 * Centralizes what happens right after a successful sign-in on the login page.
 *
 * If the customer was redirected here mid-purchase (clicked Add to Cart / Buy Now
 * while logged out), the login link carries the pending item as query params —
 * see buildLoginRedirectUrl(). On success we replay that add-to-cart here (the cart
 * requires a logged-in user, so it couldn't happen before login) and then send the
 * customer to checkout (Buy Now) or back to where they were (Add to Cart), instead
 * of dropping them on a generic /account page and making them repeat the click.
 */
export function usePostLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { incrementItemCount, notify } = useCartUi();

  async function resumeAfterLogin() {
    const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
    const productId = searchParams.get("addProductId");
    const variantId = searchParams.get("addVariantId");
    const intent = searchParams.get("intent");

    if (productId && variantId) {
      const result = await addToCartAction({ productId, variantId, quantity: 1 });
      if (result?.error) {
        // Could not add the item for a non-auth reason (e.g. now out of stock) —
        // still return the customer to where they were instead of stranding them.
        notify(result.error, "error");
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      incrementItemCount(1);
      if (intent === "buyNow") {
        router.push("/checkout");
        return;
      }
      notify("Added to your bag", "success", { href: "/cart", label: "View Cart →" });
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return { resumeAfterLogin };
}
