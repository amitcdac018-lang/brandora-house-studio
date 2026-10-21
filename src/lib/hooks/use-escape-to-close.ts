"use client";

import { useEffect, useRef } from "react";

/**
 * Keyboard support for a toggleable panel (mobile nav drawer, dropdown, etc.):
 * - Escape closes it and returns focus to the trigger button.
 * - On open, focus moves into the panel so Tab reaches its contents immediately
 *   instead of requiring an extra Tab press from the trigger.
 *
 * Pass the trigger button's ref so focus can return to it on close — without this,
 * closing via Escape would drop focus to the document body.
 */
export function useEscapeToClose<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
  triggerRef: React.RefObject<HTMLElement | null>
) {
  const panelRef = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>("a, button, input, select, textarea");
      firstFocusable?.focus();
    }
  }, [open]);

  return panelRef;
}
