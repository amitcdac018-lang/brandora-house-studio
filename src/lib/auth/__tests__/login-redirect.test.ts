import { describe, it, expect } from "vitest";
import { buildLoginRedirectUrl } from "../login-redirect";

describe("buildLoginRedirectUrl", () => {
  it("encodes the return path, product, variant and intent as query params", () => {
    const url = buildLoginRedirectUrl({
      returnTo: "/product/air-max-90",
      productId: "clprod00000000000000000000",
      variantId: "clvariant0000000000000000",
      intent: "buyNow",
    });

    const parsed = new URL(url, "https://example.com");
    expect(parsed.pathname).toBe("/login");
    expect(parsed.searchParams.get("callbackUrl")).toBe("/product/air-max-90");
    expect(parsed.searchParams.get("addProductId")).toBe("clprod00000000000000000000");
    expect(parsed.searchParams.get("addVariantId")).toBe("clvariant0000000000000000");
    expect(parsed.searchParams.get("intent")).toBe("buyNow");
  });

  it("supports the cart intent for Add to Cart redirects", () => {
    const url = buildLoginRedirectUrl({
      returnTo: "/shop?brand=nike",
      productId: "clprod00000000000000000001",
      variantId: "clvariant0000000000000001",
      intent: "cart",
    });

    const parsed = new URL(url, "https://example.com");
    expect(parsed.searchParams.get("callbackUrl")).toBe("/shop?brand=nike");
    expect(parsed.searchParams.get("intent")).toBe("cart");
  });
});
