import { describe, it, expect } from "vitest";
import { toSafeRedirectPath } from "../safe-redirect";

describe("toSafeRedirectPath", () => {
  it("allows a root-relative path", () => {
    expect(toSafeRedirectPath("/account")).toBe("/account");
    expect(toSafeRedirectPath("/product/air-max-90?size=9")).toBe("/product/air-max-90?size=9");
  });

  it("falls back to the default when given null, undefined, or empty", () => {
    expect(toSafeRedirectPath(null)).toBe("/shop");
    expect(toSafeRedirectPath(undefined)).toBe("/shop");
    expect(toSafeRedirectPath("")).toBe("/shop");
  });

  it("honors a custom fallback", () => {
    expect(toSafeRedirectPath(null, "/checkout")).toBe("/checkout");
  });

  it("rejects an absolute external URL (open-redirect attempt)", () => {
    expect(toSafeRedirectPath("https://evil.com")).toBe("/shop");
    expect(toSafeRedirectPath("http://evil.com/phish")).toBe("/shop");
  });

  it("rejects a protocol-relative URL (open-redirect attempt)", () => {
    expect(toSafeRedirectPath("//evil.com")).toBe("/shop");
  });

  it("rejects a path that doesn't start with a slash", () => {
    expect(toSafeRedirectPath("evil.com")).toBe("/shop");
    expect(toSafeRedirectPath("javascript:alert(1)")).toBe("/shop");
  });
});
