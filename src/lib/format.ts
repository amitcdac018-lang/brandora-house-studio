export function formatPrice(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function discountedPrice(basePrice: number | string, discountPct: number): number {
  const amount = typeof basePrice === "string" ? Number(basePrice) : basePrice;
  return Math.round(amount * (1 - discountPct / 100));
}
