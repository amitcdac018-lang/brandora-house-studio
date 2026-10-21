"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Toast = { id: number; message: string; type: "success" | "error"; action?: { href: string; label: string } };

type CartUiContextValue = {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementItemCount: (by: number) => void;
  notify: (message: string, type?: Toast["type"], action?: Toast["action"]) => void;
};

const CartUiContext = createContext<CartUiContextValue | null>(null);

let nextToastId = 1;
const TOAST_DURATION_MS = 3000;
// Toasts with an actionable link (e.g. "View Cart ->") get longer on screen so a
// keyboard user has a realistic chance to Tab to the link before it disappears.
const TOAST_WITH_ACTION_DURATION_MS = 6000;

export function CartUiProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetched client-side (rather than passed from the layout) so reading the session here
  // never forces every page under the storefront layout into dynamic rendering.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart/count")
      .then((res) => res.json())
      .then((data: { count?: number }) => {
        if (!cancelled && typeof data.count === "number") setItemCount(data.count);
      })
      .catch(() => {
        // Non-fatal — the badge just stays at 0 until the next cart mutation updates it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const notify = useCallback((message: string, type: Toast["type"] = "success", action?: Toast["action"]) => {
    const id = nextToastId++;
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(
      () => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      },
      action ? TOAST_WITH_ACTION_DURATION_MS : TOAST_DURATION_MS
    );
  }, []);

  const incrementItemCount = useCallback((by: number) => {
    setItemCount((prev) => Math.max(0, prev + by));
  }, []);

  const value = useMemo(
    () => ({ itemCount, setItemCount, incrementItemCount, notify }),
    [itemCount, incrementItemCount, notify]
  );

  return (
    <CartUiContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === "success" ? "bg-brand-ink text-brand-gold-soft" : "bg-brand-danger text-white"
            }`}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <Link href={toast.action.href} className="shrink-0 underline hover:no-underline">
                {toast.action.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </CartUiContext.Provider>
  );
}

export function useCartUi(): CartUiContextValue {
  const ctx = useContext(CartUiContext);
  if (!ctx) throw new Error("useCartUi must be used within CartUiProvider");
  return ctx;
}
