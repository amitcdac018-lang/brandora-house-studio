import { describe, it, expect, vi, beforeEach } from "vitest";

const requireUserMock = vi.fn();
const rateLimitMock = vi.fn();
const getCartWithItemsMock = vi.fn();
const calculateShippingMock = vi.fn();
const getRazorpayClientMock = vi.fn();

const prismaMock = {
  order: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  address: { findUnique: vi.fn() },
  productVariant: { update: vi.fn() },
  inventoryLog: { create: vi.fn() },
  orderItem: { findMany: vi.fn() },
  payment: { create: vi.fn() },
  auditLog: { create: vi.fn() },
  cartItem: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/guards", () => ({ requireUser: () => requireUserMock() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => rateLimitMock() }));
vi.mock("@/lib/data/cart", () => ({ getCartWithItems: () => getCartWithItemsMock() }));
vi.mock("@/lib/shipping/calculate", () => ({ calculateShipping: () => calculateShippingMock() }));
vi.mock("@/lib/payments/razorpay", () => ({ getRazorpayClient: () => getRazorpayClientMock() }));
vi.mock("next/headers", () => ({
  headers: async () => new Map([["x-forwarded-for", "127.0.0.1"]]),
}));

const VALID_ADDRESS_ID = "cls4qj3x40000ks08h1n2k3l4";
const VALID_IDEMPOTENCY_KEY = "3f4b48d9-219d-4881-aca4-b732fdeb8652";

describe("createOrderAction — Razorpay failure compensation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    requireUserMock.mockResolvedValue({ id: "user_1", email: "customer@example.com" });
    rateLimitMock.mockResolvedValue({ success: true });
    prismaMock.order.findUnique.mockResolvedValue(null); // no existing order for this idempotency key
    prismaMock.address.findUnique.mockResolvedValue({ id: VALID_ADDRESS_ID, userId: "user_1" });

    getCartWithItemsMock.mockResolvedValue({
      id: "cart_1",
      items: [
        {
          variantId: "variant_1",
          productId: "product_1",
          quantity: 1,
          product: { name: "Test Shoe" },
        },
      ],
    });

    calculateShippingMock.mockResolvedValue({ charge: 99, estimatedDays: 5 });

    // $transaction executes the callback against a tx object shaped like prisma itself.
    prismaMock.$transaction.mockImplementation(async (fn) => {
      const tx = {
        productVariant: {
          findUnique: vi.fn().mockResolvedValue({
            id: "variant_1",
            productId: "product_1",
            sku: "SKU-1",
            size: "UK 8",
            color: "Black",
            stock: 10,
            priceOverride: null,
            isActive: true,
            product: { name: "Test Shoe", basePrice: 1000, discountPct: 0, isActive: true },
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        inventoryLog: { create: vi.fn().mockResolvedValue({}) },
        order: {
          create: vi.fn().mockResolvedValue({
            id: "order_1",
            orderNumber: "BHS-TEST-0001",
            grandTotal: 1099,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        cartItem: { deleteMany: vi.fn().mockResolvedValue({}) },
        orderItem: {
          findMany: vi.fn().mockResolvedValue([{ variantId: "variant_1", quantity: 1 }]),
        },
      };
      return fn(tx);
    });
  });

  it("releases the stock reservation and marks the order PAYMENT_FAILED when Razorpay order creation fails", async () => {
    getRazorpayClientMock.mockReturnValue({
      orders: {
        create: vi.fn().mockRejectedValue(new Error("Razorpay API unreachable")),
      },
    });

    const { createOrderAction } = await import("../checkout");
    const result = await createOrderAction({
      addressId: VALID_ADDRESS_ID,
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
    });

    expect(result.error).toContain("Could not start payment");

    // releaseOrderReservation should have run a second transaction to restore stock and fail the order.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);

    // No Payment record should ever be created for an order whose Razorpay order was never made.
    expect(prismaMock.payment.create).not.toHaveBeenCalled();
  });

  it("succeeds normally and creates a Payment record when Razorpay order creation works", async () => {
    getRazorpayClientMock.mockReturnValue({
      orders: {
        create: vi.fn().mockResolvedValue({ id: "razorpay_order_123" }),
      },
    });
    prismaMock.payment.create.mockResolvedValue({});
    prismaMock.auditLog.create.mockResolvedValue({});

    const { createOrderAction } = await import("../checkout");
    const result = await createOrderAction({
      addressId: VALID_ADDRESS_ID,
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
    });

    expect(result.ok).toBe(true);
    expect(result.razorpayOrderId).toBe("razorpay_order_123");
    expect(prismaMock.payment.create).toHaveBeenCalledTimes(1);
    // Only the order-creation transaction should run — no compensating rollback transaction.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("returns a cart-empty error without ever touching Razorpay when the cart has no items", async () => {
    getCartWithItemsMock.mockResolvedValue({ id: "cart_1", items: [] });
    const razorpayOrdersCreate = vi.fn();
    getRazorpayClientMock.mockReturnValue({ orders: { create: razorpayOrdersCreate } });

    const { createOrderAction } = await import("../checkout");
    const result = await createOrderAction({
      addressId: VALID_ADDRESS_ID,
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
    });

    expect(result.error).toBe("Your cart is empty.");
    expect(razorpayOrdersCreate).not.toHaveBeenCalled();
  });
});
