import { describe, it, expect } from "vitest";
import { rateLimit } from "../index";

describe("rateLimit", () => {
  it("allows requests under the limit", async () => {
    const key = `test-key-${crypto.randomUUID()}`;
    const result = await rateLimit(key, { limit: 3, windowMs: 1000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests once the limit is exceeded within the window", async () => {
    const key = `test-key-${crypto.randomUUID()}`;
    await rateLimit(key, { limit: 2, windowMs: 1000 });
    await rateLimit(key, { limit: 2, windowMs: 1000 });
    const third = await rateLimit(key, { limit: 2, windowMs: 1000 });
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets the window after it expires", async () => {
    const key = `test-key-${crypto.randomUUID()}`;
    await rateLimit(key, { limit: 1, windowMs: 50 });
    const blocked = await rateLimit(key, { limit: 1, windowMs: 50 });
    expect(blocked.success).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));

    const afterReset = await rateLimit(key, { limit: 1, windowMs: 50 });
    expect(afterReset.success).toBe(true);
  });

  it("tracks independent keys separately", async () => {
    const keyA = `test-key-a-${crypto.randomUUID()}`;
    const keyB = `test-key-b-${crypto.randomUUID()}`;
    await rateLimit(keyA, { limit: 1, windowMs: 1000 });
    const resultB = await rateLimit(keyB, { limit: 1, windowMs: 1000 });
    expect(resultB.success).toBe(true);
  });
});
