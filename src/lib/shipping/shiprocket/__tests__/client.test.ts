import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const originalFetch = global.fetch;

function mockFetchSequence(responses: { status: number; body: unknown }[]) {
  let call = 0;
  global.fetch = vi.fn(async () => {
    const response = responses[Math.min(call, responses.length - 1)];
    call += 1;
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.body,
    } as Response;
  });
}

describe("createShiprocketOrder — pickup location error handling", () => {
  beforeEach(() => {
    process.env.SHIPROCKET_EMAIL = "test@example.com";
    process.env.SHIPROCKET_PASSWORD = "test-password";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.resetModules();
  });

  const validInput = {
    orderNumber: "TEST-001",
    orderDate: new Date("2026-01-01"),
    pickupLocationLabel: "wrong-label",
    billing: {
      customerName: "Test User",
      address: "123 Test St",
      city: "Bhopal",
      pincode: "462016",
      state: "Madhya Pradesh",
      phone: "9876543210",
      email: "customer@example.com",
    },
    items: [{ name: "Test Item", sku: "SKU-1", units: 1, selling_price: 100 }],
    subTotal: 100,
    paymentMethod: "Prepaid" as const,
    dimensions: { lengthCm: 10, breadthCm: 10, heightCm: 10, weightKg: 0.5 },
  };

  it("surfaces Shiprocket's own listed pickup locations when the configured one doesn't match", async () => {
    mockFetchSequence([
      { status: 200, body: { token: "fake-token" } }, // auth
      {
        // Real Shiprocket behavior observed in production: HTTP 200 with an error-shaped body.
        status: 200,
        body: {
          message: "Wrong Pickup location entered. Please choose one location from the data given",
          data: {
            data: [{ id: 132000753, pickup_location: "home", city: "Bhopal" }],
          },
        },
      },
    ]);

    const { createShiprocketOrder } = await import("../client");
    await expect(createShiprocketOrder(validInput)).rejects.toThrow(
      /Valid pickup location labels on this account: home/
    );
  });

  it("succeeds normally when order_id and shipment_id are present", async () => {
    mockFetchSequence([
      { status: 200, body: { token: "fake-token" } },
      { status: 200, body: { order_id: 123, shipment_id: 456, status: "NEW", status_code: 1 } },
    ]);

    const { createShiprocketOrder } = await import("../client");
    const result = await createShiprocketOrder(validInput);
    expect(result).toEqual({ order_id: 123, shipment_id: 456, status: "NEW", status_code: 1 });
  });
});
