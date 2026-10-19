import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { mapShiprocketStatus } from "@/lib/shipping/shiprocket/status-map";

type ShiprocketWebhookPayload = {
  awb: string;
  courier_name?: string;
  current_status: string;
  order_id: string;
  sr_order_id?: number;
};

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Shiprocket webhook — pushes tracking status updates as shipments move.
 * Auth is a static shared secret in the x-api-key header (configured in the
 * Shiprocket dashboard to match SHIPROCKET_WEBHOOK_TOKEN), not HMAC-signed.
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;

  if (!expectedToken) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (!apiKey || !safeCompare(apiKey, expectedToken)) {
    return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as ShiprocketWebhookPayload | null;
  if (!payload?.awb) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const shipment = await prisma.shipment.findFirst({
    where: { trackingNumber: payload.awb },
  });

  if (!shipment) {
    // Not an error — Shiprocket may retry or send events for shipments we don't track yet.
    return NextResponse.json({ received: true, matched: false });
  }

  const mappedStatus = mapShiprocketStatus(payload.current_status);

  await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      ...(mappedStatus ? { status: mappedStatus } : {}),
      courierName: payload.courier_name ?? shipment.courierName,
      lastWebhookPayload: payload as object,
      ...(mappedStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });

  if (mappedStatus === "DELIVERED") {
    await prisma.order.update({ where: { id: shipment.orderId }, data: { status: "DELIVERED" } });
  }

  await prisma.auditLog.create({
    data: {
      action: "SHIPMENT_WEBHOOK_RECEIVED",
      entityType: "Shipment",
      entityId: shipment.id,
      orderId: shipment.orderId,
      metadata: { current_status: payload.current_status, mappedStatus },
    },
  });

  return NextResponse.json({ received: true, matched: true });
}
