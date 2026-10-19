import { describe, it, expect } from "vitest";
import { addToCartSchema, updateCartItemSchema } from "../cart";

describe("cart validation schemas", () => {
  it("rejects a quantity above the maximum of 10", () => {
    const result = addToCartSchema.safeParse({
      productId: "clx00000000000000000000000",
      variantId: "clx00000000000000000000001",
      quantity: 11,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a quantity of zero", () => {
    const result = updateCartItemSchema.safeParse({
      cartItemId: "clx00000000000000000000000",
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("defaults quantity to 1 when omitted", () => {
    const result = addToCartSchema.safeParse({
      productId: "clx00000000000000000000000",
      variantId: "clx00000000000000000000001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it("rejects a non-integer quantity", () => {
    const result = addToCartSchema.safeParse({
      productId: "clx00000000000000000000000",
      variantId: "clx00000000000000000000001",
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });
});
