"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addToCartAction } from "@/lib/actions/cart";
import { toSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { useCartUi } from "@/components/cart/cart-ui-context";

/**
 * Centralizes what happens right after a successful sign-in on the login page.
 *
 * If the customer was redirected here mid-purchase (clicked Add to Cart / Buy Now
 * while logged out), the login link carries the pending item as query params —
 * see buildLoginRedirectUrl(). On success we replay that add-to-cart here (the cart
 * requires a logged-in user, so it couldn't happen before login) and then send the
 * customer to checkout (Buy Now) or back to where they were (Add to Cart), instead
 * of making them repeat the click. With no callbackUrl at all (e.g. they navigated
 * to /login directly), toSafeRedirectPath falls back to the home page ("/").
 */
export function usePostLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { incrementItemCount, notify } = useCartUi();

  async function resumeAfterLogin() {
    const callbackUrl = toSafeRedirectPath(searchParams.get("callbackUrl"));
    const productId = searchParams.get("addProductId");
    const variantId = searchParams.get("addVariantId");
    const intent = searchParams.get("intent");

    // Use replace() (not push()) for every post-login navigation — the login page
    // should never reappear if the customer presses the browser Back button after
    // successfully signing in. push() would leave /login sitting in the history
    // stack right underneath the destination.
    if (productId && variantId) {
      const result = await addToCartAction({ productId, variantId, quantity: 1 });
      if (result?.error) {
        // Could not add the item for a non-auth reason (e.g. now out of stock) —
        // still return the customer to where they were instead of stranding them.
        notify(result.error, "error");
        router.replace(callbackUrl);
        router.refresh();
        return;
      }

      incrementItemCount(1);
      if (intent === "buyNow") {
        router.replace("/checkout");
        return;
      }
      notify("Added to your bag", "success", { href: "/cart", label: "View Cart →" });
    }

    router.replace(callbackUrl);
    router.refresh();
  }

  return { resumeAfterLogin };
}
