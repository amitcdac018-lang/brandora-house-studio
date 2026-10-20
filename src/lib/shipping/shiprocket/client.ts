import "server-only";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Shiprocket requires a bare 10-digit Indian mobile number for billing_phone — no country
 * code, spaces, or punctuation. Our own address form accepts a looser format (it supports
 * other use cases), so normalize here rather than tightening validation app-wide.
 */
export function toShiprocketPhone(rawPhone: string): string | null {
  const digitsOnly = rawPhone.replace(/\D/g, "");
  const withoutCountryCode =
    digitsOnly.length === 12 && digitsOnly.startsWith("91")
      ? digitsOnly.slice(2)
      : digitsOnly.length === 11 && digitsOnly.startsWith("0")
        ? digitsOnly.slice(1)
        : digitsOnly;

  return /^[6-9]\d{9}$/.test(withoutCountryCode) ? withoutCountryCode : null;
}

/**
 * When Shiprocket rejects an unrecognized pickup_location, it helpfully echoes the account's
 * actual registered pickup locations under data.data[].pickup_location. Pull those out so the
 * error message tells you exactly what SHIPROCKET_PICKUP_LOCATION should be instead of just
 * saying it's wrong.
 */
function extractPickupLocationLabels(raw: Record<string, unknown>): string[] {
  const data = raw.data;
  if (!data || typeof data !== "object") return [];
  const innerData = (data as Record<string, unknown>).data;
  if (!Array.isArray(innerData)) return [];

  return innerData
    .map((entry) =>
      entry && typeof entry === "object" && typeof (entry as Record<string, unknown>).pickup_location === "string"
        ? ((entry as Record<string, unknown>).pickup_location as string)
        : null
    )
    .filter((label): label is string => label !== null);
}

type ShiprocketTokenCache = { token: string; expiresAt: number } | null;
let tokenCache: ShiprocketTokenCache = null;

/**
 * Shiprocket auth tokens are valid for ~10 days, so we cache in memory and only
 * re-authenticate when expired (with a safety margin) rather than on every call.
 */
async function getAuthToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: getEnv("SHIPROCKET_EMAIL"),
      password: getEnv("SHIPROCKET_PASSWORD"),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Shiprocket authentication failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { token: string };
  // Cache for 9 days even though tokens last ~10, to leave a safety margin.
  tokenCache = { token: data.token, expiresAt: now + 9 * 24 * 60 * 60 * 1000 };
  return data.token;
}

async function shiprocketFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Shiprocket API error: ${describeShiprocketErrorBody(body, response.status)}`);
  }

  return body as T;
}

/**
 * Shiprocket's top-level "message" is often a generic "Oops! Invalid Data." while the actual
 * field-level reason lives in a nested "errors" object (e.g. { billing_phone: ["..."] }).
 * Surface that detail so admins see something actionable instead of a generic failure.
 */
function describeShiprocketErrorBody(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const typed = body as { message?: unknown; errors?: Record<string, unknown> };
    const fieldErrors = typed.errors && typeof typed.errors === "object" ? typed.errors : null;

    if (fieldErrors) {
      const details = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : String(msgs)}`)
        .join("; ");
      if (details) return details;
    }

    if (typeof typed.message === "string") return typed.message;
  }
  return `HTTP ${status}`;
}

export type ShiprocketOrderItem = {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
};

export type CreateShiprocketOrderInput = {
  orderNumber: string;
  orderDate: Date;
  pickupLocationLabel: string;
  billing: {
    customerName: string;
    lastName?: string;
    address: string;
    city: string;
    pincode: string;
    state: string;
    phone: string;
    email: string;
  };
  items: ShiprocketOrderItem[];
  subTotal: number;
  paymentMethod: "Prepaid" | "COD";
  dimensions: { lengthCm: number; breadthCm: number; heightCm: number; weightKg: number };
};

export type CreateShiprocketOrderResult = {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
};

function formatOrderDate(date: Date): string {
  // Shiprocket expects "YYYY-MM-DD HH:mm" in IST-ish local format; UTC is accepted in practice.
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export async function createShiprocketOrder(
  input: CreateShiprocketOrderInput
): Promise<CreateShiprocketOrderResult> {
  const raw = await shiprocketFetch<Record<string, unknown>>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id: input.orderNumber,
      order_date: formatOrderDate(input.orderDate),
      pickup_location: input.pickupLocationLabel,
      billing_customer_name: input.billing.customerName,
      billing_last_name: input.billing.lastName ?? "",
      billing_address: input.billing.address,
      billing_city: input.billing.city,
      billing_pincode: input.billing.pincode,
      billing_state: input.billing.state,
      billing_country: "India",
      billing_email: input.billing.email,
      billing_phone: input.billing.phone,
      shipping_is_billing: true,
      order_items: input.items,
      payment_method: input.paymentMethod,
      sub_total: input.subTotal,
      length: input.dimensions.lengthCm,
      breadth: input.dimensions.breadthCm,
      height: input.dimensions.heightCm,
      weight: input.dimensions.weightKg,
    }),
  });

  // Shiprocket returns some validation failures (e.g. an unrecognized pickup_location) as an
  // HTTP 200 with an error-shaped body rather than a non-2xx status, so a plain response.ok
  // check doesn't catch them. Detect that shape explicitly and surface the valid pickup
  // location labels it helpfully lists, since a mismatched label is the most common cause.
  if (typeof raw.message === "string" && raw.order_id === undefined) {
    const pickupOptions = extractPickupLocationLabels(raw);
    const hint = pickupOptions.length
      ? ` Valid pickup location labels on this account: ${pickupOptions.join(", ")}.`
      : "";
    throw new Error(`${raw.message}${hint}`);
  }

  const orderId = raw.order_id;
  const shipmentId = raw.shipment_id;

  if (orderId === undefined || shipmentId === undefined) {
    throw new Error(
      `Shiprocket order created but response is missing order_id/shipment_id. Raw response: ${JSON.stringify(raw)}`
    );
  }

  return {
    order_id: Number(orderId),
    shipment_id: Number(shipmentId),
    status: String(raw.status ?? ""),
    status_code: Number(raw.status_code ?? 0),
  };
}

export type AssignAwbResult = {
  awb_code: string;
  courier_name: string;
  courier_company_id: number;
};

/** Auto-selects the best courier when courierId is omitted. */
export async function assignAwb(shipmentId: number, courierId?: number): Promise<AssignAwbResult> {
  const result = await shiprocketFetch<{ response: { data: AssignAwbResult } }>(
    "/courier/assign/awb",
    {
      method: "POST",
      body: JSON.stringify({
        shipment_id: shipmentId,
        ...(courierId ? { courier_id: courierId } : {}),
      }),
    }
  );
  return result.response.data;
}

export async function cancelShiprocketOrder(shiprocketOrderId: string): Promise<void> {
  await shiprocketFetch("/orders/cancel", {
    method: "POST",
    body: JSON.stringify({ ids: [Number(shiprocketOrderId)] }),
  });
}
