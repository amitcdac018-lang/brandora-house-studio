import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("password hashing", () => {
  it("hashes a password and verifies the correct password matches", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    expect(hash).not.toEqual("Sup3rSecret!");
    await expect(verifyPassword("Sup3rSecret!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password against a stored hash", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    await expect(verifyPassword("WrongPassword1", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    const hashA = await hashPassword("RepeatMe123");
    const hashB = await hashPassword("RepeatMe123");
    expect(hashA).not.toEqual(hashB);
  });
});
