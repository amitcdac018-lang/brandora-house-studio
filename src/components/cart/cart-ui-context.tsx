"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Toast = { id: number; message: string; type: "success" | "error" };

type CartUiContextValue = {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementItemCount: (by: number) => void;
  notify: (message: string, type?: Toast["type"]) => void;
};

const CartUiContext = createContext<CartUiContextValue | null>(null);

let nextToastId = 1;
const TOAST_DURATION_MS = 3000;

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

  const notify = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = nextToastId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
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
            className={`pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === "success" ? "bg-brand-ink text-brand-gold-soft" : "bg-brand-danger text-white"
            }`}
          >
            {toast.message}
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
