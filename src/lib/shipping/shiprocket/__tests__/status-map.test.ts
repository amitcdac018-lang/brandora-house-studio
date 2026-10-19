import { describe, it, expect } from "vitest";
import { mapShiprocketStatus } from "../status-map";

describe("mapShiprocketStatus", () => {
  it("maps known Shiprocket statuses to internal ShipmentStatus values", () => {
    expect(mapShiprocketStatus("IN TRANSIT")).toBe("SHIPPED");
    expect(mapShiprocketStatus("OUT FOR DELIVERY")).toBe("OUT_FOR_DELIVERY");
    expect(mapShiprocketStatus("DELIVERED")).toBe("DELIVERED");
    expect(mapShiprocketStatus("CANCELLED")).toBe("CANCELLED");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(mapShiprocketStatus("  delivered  ")).toBe("DELIVERED");
    expect(mapShiprocketStatus("in transit")).toBe("SHIPPED");
  });

  it("returns null for an unrecognized status rather than guessing", () => {
    expect(mapShiprocketStatus("SOME_NEW_STATUS_SHIPROCKET_ADDED")).toBeNull();
  });
});
