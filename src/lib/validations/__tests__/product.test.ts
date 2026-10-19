import { describe, it, expect } from "vitest";
import { productQuerySchema } from "../product";

describe("productQuerySchema", () => {
  it("normalizes a single brand value from the URL into an array", () => {
    const result = productQuerySchema.safeParse({ brand: "nike" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brand).toEqual(["nike"]);
    }
  });

  it("keeps multiple brand values as an array", () => {
    const result = productQuerySchema.safeParse({ brand: ["nike", "campus"] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brand).toEqual(["nike", "campus"]);
    }
  });

  it("leaves brand undefined when not provided", () => {
    const result = productQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brand).toBeUndefined();
    }
  });

  it("normalizes size and color the same way as brand", () => {
    const result = productQuerySchema.safeParse({ size: "UK 8", color: "Black" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.size).toEqual(["UK 8"]);
      expect(result.data.color).toEqual(["Black"]);
    }
  });

  it("coerces page and pageSize from query strings", () => {
    const result = productQuerySchema.safeParse({ page: "2", pageSize: "12" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(12);
    }
  });
});
