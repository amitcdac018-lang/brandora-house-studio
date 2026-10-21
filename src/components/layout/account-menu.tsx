"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { User, ChevronDown, UserCircle, LogOut } from "lucide-react";
import { useEscapeToClose } from "@/lib/hooks/use-escape-to-close";
import { signOutAction } from "@/lib/actions/auth";

type SessionSummary = { authenticated: boolean; name?: string | null; email?: string | null };

export function AccountMenu() {
  const router = useRouter();
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useEscapeToClose<HTMLDivElement>(open, () => setOpen(false), triggerRef);

  // Fetched client-side (not from the layout) so knowing whether to show the dropdown
  // never forces every page under the storefront layout into dynamic rendering — same
  // reasoning as the cart badge in cart-ui-context.tsx.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session-summary")
      .then((res) => res.json())
      .then((data: SessionSummary) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession({ authenticated: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on an outside click (mouse users), in addition to Escape (keyboard) already
  // handled by useEscapeToClose.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function handleSignOut() {
    setOpen(false);
    startTransition(async () => {
      await signOutAction();
      router.push("/login");
      router.refresh();
    });
  }

  if (!session) {
    // Session status not yet known — render a neutral placeholder so there's no
    // flash between "Sign In" and the dropdown once the fetch resolves.
    return <span className="block h-5 w-5" aria-hidden="true" />;
  }

  if (!session.authenticated) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-brand-ink-soft transition-colors hover:text-brand-gold"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label="My account"
        className="flex items-center gap-1 text-brand-ink-soft transition-colors hover:text-brand-gold"
      >
        <User className="h-5 w-5" />
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="account-menu"
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full mt-2 w-48 rounded-md border border-brand-cream-dark bg-white py-1 shadow-lg"
        >
          {(session.name || session.email) && (
            <p className="truncate border-b border-brand-cream-dark px-4 py-2 text-xs text-brand-ink-soft">
              {session.name ?? session.email}
            </p>
          )}
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-brand-ink hover:bg-brand-cream"
          >
            <UserCircle className="h-4 w-4" />
            My Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isPending}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-brand-danger hover:bg-brand-danger/10 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {isPending ? "Signing out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
