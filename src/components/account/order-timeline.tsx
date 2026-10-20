import { CheckCircle2, Circle, PackageX } from "lucide-react";

type TimelineStep = {
  label: string;
  date: Date | null;
  reached: boolean;
};

export function OrderTimeline({
  status,
  createdAt,
  shippedAt,
  deliveredAt,
}: {
  status: string;
  createdAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}) {
  if (status === "CANCELLED" || status === "REFUNDED" || status === "PAYMENT_FAILED") {
    const labels: Record<string, string> = {
      CANCELLED: "Order Cancelled",
      REFUNDED: "Order Refunded",
      PAYMENT_FAILED: "Payment Failed",
    };
    return (
      <div className="flex items-center gap-3 rounded-lg bg-brand-danger/10 p-4 text-brand-danger">
        <PackageX className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium">{labels[status]}</span>
      </div>
    );
  }

  const isPaidOrLater = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status);
  const isShippedOrLater = ["SHIPPED", "DELIVERED"].includes(status) || Boolean(shippedAt);
  const isDelivered = status === "DELIVERED" || Boolean(deliveredAt);

  const steps: TimelineStep[] = [
    { label: "Order Placed", date: createdAt, reached: true },
    { label: "Confirmed", date: isPaidOrLater ? createdAt : null, reached: isPaidOrLater },
    { label: "Shipped", date: shippedAt, reached: isShippedOrLater },
    { label: "Delivered", date: deliveredAt, reached: isDelivered },
  ];

  return (
    <>
      {/* Vertical layout on narrow screens, where 4 side-by-side labels get cramped */}
      <div className="flex flex-col gap-4 sm:hidden">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              {step.reached ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-brand-success" />
              ) : (
                <Circle className="h-6 w-6 shrink-0 text-brand-cream-dark" />
              )}
              {index < steps.length - 1 && (
                <div
                  className={`mt-1 h-6 w-0.5 ${steps[index + 1].reached ? "bg-brand-success" : "bg-brand-cream-dark"}`}
                />
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${step.reached ? "text-brand-ink" : "text-brand-ink-soft/60"}`}>
                {step.label}
              </p>
              <p className="text-xs text-brand-ink-soft/60">
                {step.date ? step.date.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Horizontal layout from sm and up */}
      <div className="hidden items-start sm:flex">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center text-center">
              {step.reached ? (
                <CheckCircle2 className="h-6 w-6 text-brand-success" />
              ) : (
                <Circle className="h-6 w-6 text-brand-cream-dark" />
              )}
              <p className={`mt-2 text-xs font-medium ${step.reached ? "text-brand-ink" : "text-brand-ink-soft/60"}`}>
                {step.label}
              </p>
              <p className="mt-0.5 text-[11px] text-brand-ink-soft/60">
                {step.date ? step.date.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-1 mt-[-20px] h-0.5 flex-1 ${
                  steps[index + 1].reached ? "bg-brand-success" : "bg-brand-cream-dark"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
