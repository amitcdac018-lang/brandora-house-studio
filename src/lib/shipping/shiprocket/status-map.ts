import type { $Enums } from "@prisma/client";

/**
 * Maps Shiprocket's free-text current_status values to our internal ShipmentStatus enum.
 * Unrecognized statuses fall back to the previous status rather than guessing — see caller.
 */
const STATUS_MAP: Record<string, $Enums.ShipmentStatus> = {
  "NEW": "PENDING",
  "PICKUP SCHEDULED": "PACKED",
  "PICKUP GENERATED": "PACKED",
  "PICKED UP": "SHIPPED",
  "IN TRANSIT": "SHIPPED",
  "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
  "DELIVERED": "DELIVERED",
  "RTO INITIATED": "FAILED_DELIVERY",
  "RTO DELIVERED": "RETURNED",
  "CANCELLED": "CANCELLED",
  "UNDELIVERED": "FAILED_DELIVERY",
  "LOST": "FAILED_DELIVERY",
};

export function mapShiprocketStatus(currentStatus: string): $Enums.ShipmentStatus | null {
  return STATUS_MAP[currentStatus.trim().toUpperCase()] ?? null;
}
