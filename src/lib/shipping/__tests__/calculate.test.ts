import { describe, it, expect, vi, beforeEach } from "vitest";

const findManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    shippingRule: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
  },
}));

// unstable_cache requires a real Next.js request/incremental-cache context that doesn't
// exist in a plain Vitest unit test — mock it as a passthrough so these tests exercise
// calculateShipping's own logic rather than Next's caching runtime.
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

describe("calculateShipping", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns a fallback charge when no shipping rules are configured", async () => {
    findManyMock.mockResolvedValue([]);
    const { calculateShipping } = await import("../calculate");
    const result = await calculateShipping(500);
    expect(result.charge).toBeGreaterThanOrEqual(0);
    expect(result.estimatedDays).toBeGreaterThan(0);
  });

  it("applies free shipping when the subtotal meets the threshold", async () => {
    findManyMock.mockResolvedValue([
      { minOrderValue: 2000, maxOrderValue: null, charge: 0, estimatedDays: 5 },
      { minOrderValue: 0, maxOrderValue: 1999.99, charge: 99, estimatedDays: 6 },
    ]);
    const { calculateShipping } = await import("../calculate");
    const result = await calculateShipping(2500);
    expect(result.charge).toBe(0);
    expect(result.estimatedDays).toBe(5);
  });

  it("applies the standard charge for an order below the free-shipping threshold", async () => {
    findManyMock.mockResolvedValue([
      { minOrderValue: 2000, maxOrderValue: null, charge: 0, estimatedDays: 5 },
      { minOrderValue: 0, maxOrderValue: 1999.99, charge: 99, estimatedDays: 6 },
    ]);
    const { calculateShipping } = await import("../calculate");
    const result = await calculateShipping(500);
    expect(result.charge).toBe(99);
    expect(result.estimatedDays).toBe(6);
  });
});
