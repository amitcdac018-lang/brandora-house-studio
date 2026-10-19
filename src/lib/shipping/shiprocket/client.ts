import "server-only";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
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
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `HTTP ${response.status}`;
    throw new Error(`Shiprocket API error: ${message}`);
  }

  return body as T;
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
  return shiprocketFetch<CreateShiprocketOrderResult>("/orders/create/adhoc", {
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
