import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

const requireUserMock = vi.fn();

const prismaMock = {
  address: { findUnique: vi.fn(), delete: vi.fn() },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({
  requireUser: () => requireUserMock(),
  UnauthorizedError,
}));

const ADDRESS_ID = "claddress000000000000000000";
const USER_ID = "cluser0000000000000000000000";

describe("deleteAddressAction", () => {
  beforeEach(() => {
    vi.resetModules();
    requireUserMock.mockReset();
    prismaMock.address.findUnique.mockReset();
    prismaMock.address.delete.mockReset();
  });

  it("returns a friendly error instead of crashing when the address is still used on a past order", async () => {
    requireUserMock.mockResolvedValue({ id: USER_ID });
    prismaMock.address.findUnique.mockResolvedValue({ id: ADDRESS_ID, userId: USER_ID });
    prismaMock.address.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
        clientVersion: "test",
      })
    );

    const { deleteAddressAction } = await import("../address");
    const result = await deleteAddressAction(ADDRESS_ID);

    expect(result).toEqual({
      error: "This address is used on a past order and can't be deleted. You can add a new address instead.",
    });
  });

  it("re-throws a Prisma error that isn't the expected foreign-key-constraint case", async () => {
    requireUserMock.mockResolvedValue({ id: USER_ID });
    prismaMock.address.findUnique.mockResolvedValue({ id: ADDRESS_ID, userId: USER_ID });
    prismaMock.address.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "test" })
    );

    const { deleteAddressAction } = await import("../address");
    await expect(deleteAddressAction(ADDRESS_ID)).rejects.toThrow("Record not found");
  });

  it("deletes successfully when there's no constraint conflict", async () => {
    requireUserMock.mockResolvedValue({ id: USER_ID });
    prismaMock.address.findUnique.mockResolvedValue({ id: ADDRESS_ID, userId: USER_ID });
    prismaMock.address.delete.mockResolvedValue({ id: ADDRESS_ID });

    const { deleteAddressAction } = await import("../address");
    const result = await deleteAddressAction(ADDRESS_ID);

    expect(result).toEqual({ ok: true });
  });

  it("returns a sign-in error instead of throwing when there is no session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());

    const { deleteAddressAction } = await import("../address");
    const result = await deleteAddressAction(ADDRESS_ID);

    expect(result).toEqual({ error: "Please sign in to manage your addresses." });
  });

  it("rejects deleting another user's address", async () => {
    requireUserMock.mockResolvedValue({ id: USER_ID });
    prismaMock.address.findUnique.mockResolvedValue({ id: ADDRESS_ID, userId: "cl-someone-else-00000000000" });

    const { deleteAddressAction } = await import("../address");
    const result = await deleteAddressAction(ADDRESS_ID);

    expect(result).toEqual({ error: "Address not found." });
    expect(prismaMock.address.delete).not.toHaveBeenCalled();
  });
});
