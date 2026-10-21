/**
 * Builds a /login URL carrying a pending "add to cart" intent, so that after the
 * customer signs in, usePostLoginRedirect() can replay the add and continue straight
 * to checkout (Buy Now) or back to the current page (Add to Cart) — instead of
 * dropping them on a generic page and making them repeat the click.
 */
export function buildLoginRedirectUrl({
  returnTo,
  productId,
  variantId,
  intent,
}: {
  returnTo: string;
  productId: string;
  variantId: string;
  intent: "cart" | "buyNow";
}): string {
  const params = new URLSearchParams({
    callbackUrl: returnTo,
    addProductId: productId,
    addVariantId: variantId,
    intent,
  });
  return `/login?${params.toString()}`;
}
