import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

describe("auth guards", () => {
  beforeEach(() => {
    authMock.mockReset();
    vi.resetModules();
  });

  it("requireUser throws UnauthorizedError when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { requireUser, UnauthorizedError } = await import("../guards");
    await expect(requireUser()).rejects.toThrow(UnauthorizedError);
  });

  it("requireUser returns the user when a session exists", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1", role: "CUSTOMER" } });
    const { requireUser } = await import("../guards");
    const user = await requireUser();
    expect(user).toEqual({ id: "user_1", role: "CUSTOMER" });
  });

  it("requireAdmin throws ForbiddenError for a logged-in non-admin user", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1", role: "CUSTOMER" } });
    const { requireAdmin, ForbiddenError } = await import("../guards");
    await expect(requireAdmin()).rejects.toThrow(ForbiddenError);
  });

  it("requireAdmin throws UnauthorizedError when there is no session at all", async () => {
    authMock.mockResolvedValue(null);
    const { requireAdmin, UnauthorizedError } = await import("../guards");
    await expect(requireAdmin()).rejects.toThrow(UnauthorizedError);
  });

  it("requireAdmin succeeds and returns the user for an ADMIN role", async () => {
    authMock.mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } });
    const { requireAdmin } = await import("../guards");
    const admin = await requireAdmin();
    expect(admin.role).toBe("ADMIN");
  });
});
