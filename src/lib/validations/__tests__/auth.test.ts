import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, passwordSchema } from "../auth";

describe("auth validation schemas", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Abcdef12").success).toBe(true);
  });

  it("rejects a password missing an uppercase letter", () => {
    expect(passwordSchema.safeParse("abcdef12").success).toBe(false);
  });

  it("rejects a password missing a number", () => {
    expect(passwordSchema.safeParse("Abcdefgh").success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(passwordSchema.safeParse("Ab1").success).toBe(false);
  });

  it("normalizes email to lowercase on register", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "JANE@Example.com",
      password: "Abcdef12",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane@example.com");
    }
  });

  it("rejects an invalid email on login", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects registration with a name that is too short", () => {
    const result = registerSchema.safeParse({ name: "J", email: "a@b.com", password: "Abcdef12" });
    expect(result.success).toBe(false);
  });
});
