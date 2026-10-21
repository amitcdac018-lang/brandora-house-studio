import { describe, it, expect, vi, beforeEach } from "vitest";

class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

const requireUserMock = vi.fn();

const prismaMock = {
  productVariant: { findUnique: vi.fn() },
  cartItem: { findUnique: vi.fn(), upsert: vi.fn() },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/data/cart", () => ({ getOrCreateCart: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({
  requireUser: () => requireUserMock(),
  UnauthorizedError,
}));

describe("addToCartAction — unauthenticated caller", () => {
  beforeEach(() => {
    vi.resetModules();
    requireUserMock.mockReset();
  });

  it("returns a NOT_AUTHENTICATED error instead of throwing when there is no session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());

    const { addToCartAction } = await import("../cart");
    const result = await addToCartAction({
      productId: "clprod00000000000000000000",
      variantId: "clvariant0000000000000000",
      quantity: 1,
    });

    expect(result).toEqual({
      error: "Please sign in to add items to your cart.",
      code: "NOT_AUTHENTICATED",
    });
  });

  it("re-throws unexpected errors from requireUser rather than swallowing them", async () => {
    requireUserMock.mockRejectedValue(new Error("database unreachable"));

    const { addToCartAction } = await import("../cart");
    await expect(
      addToCartAction({
        productId: "clprod00000000000000000000",
        variantId: "clvariant0000000000000000",
        quantity: 1,
      })
    ).rejects.toThrow("database unreachable");
  });
});
