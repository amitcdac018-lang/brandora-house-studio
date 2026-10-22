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

  it("returns a friendly error instead of crashing when the address is still used on a past order (structured P2003)", async () => {
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

  it("returns the same friendly error for the real-world PrismaClientUnknownRequestError shape (confirmed in production)", async () => {
    // Prisma 6.19.3 does NOT always wrap an ON DELETE RESTRICT violation as a structured
    // P2003 PrismaClientKnownRequestError — in production this came through instead as a
    // PrismaClientUnknownRequestError whose message embeds the raw Postgres error text.
    // This is the exact message captured from Vercel's runtime logs for this bug.
    requireUserMock.mockResolvedValue({ id: USER_ID });
    prismaMock.address.findUnique.mockResolvedValue({ id: ADDRESS_ID, userId: USER_ID });
    prismaMock.address.delete.mockRejectedValue(
      new Error(
        'Invalid `prisma.address.delete()` invocation:\n\n\nError occurred during query execution:\nConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(PostgresError { code: "23001", message: "update or delete on table \\"Address\\" violates RESTRICT setting of foreign key constraint \\"Order_addressId_fkey\\" on table \\"Order\\"", severity: "ERROR", detail: Some("Key (id)=(cmvgdzt3e0005l50769ns8k95) is referenced from table \\"Order\\"."), column: None, hint: None }), transient: false })'
      )
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
