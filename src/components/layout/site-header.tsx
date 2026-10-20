"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { siteConfig } from "@/lib/site-config";
import { useCartUi } from "@/components/cart/cart-ui-context";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?brand=campus", label: "Campus" },
  { href: "/shop?brand=nike", label: "Nike" },
  { href: "/shop?brand=aqualite", label: "Aqualite" },
  { href: "/shop?brand=action-shoes", label: "Action Shoes" },
  { href: "/contact", label: "Contact" },
];

function NavLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentBrand = searchParams.get("brand");

  return (
    <>
      {navLinks.map((link) => {
        const [linkPath, linkQuery] = link.href.split("?");
        const linkBrand = linkQuery ? new URLSearchParams(linkQuery).get("brand") : null;
        const active = pathname === linkPath && currentBrand === linkBrand;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`transition-colors ${
              active ? "font-semibold text-brand-gold" : "text-brand-ink-soft hover:text-brand-gold"
            } ${className ?? ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer automatically whenever navigation completes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="text-brand-ink-soft transition-colors hover:text-brand-gold"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <nav
          id="mobile-nav-menu"
          aria-label="Primary"
          className="absolute inset-x-0 top-16 border-b border-brand-cream-dark bg-brand-cream px-4 py-4 shadow-md"
        >
          <div className="flex flex-col gap-4 text-base font-medium">
            <Suspense fallback={null}>
              <NavLinks onNavigate={() => setOpen(false)} />
            </Suspense>
          </div>
        </nav>
      )}
    </div>
  );
}

function CartLink() {
  const { itemCount } = useCartUi();

  return (
    <Link
      href="/cart"
      aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}`}
      className="relative text-brand-ink-soft transition-colors hover:text-brand-gold"
    >
      <ShoppingBag className="h-5 w-5" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-semibold text-brand-ink"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-cream-dark bg-brand-cream/95 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/80">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <MobileNav />
          <BrandLogo />
        </div>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Brandora House Studio on Instagram"
            className="text-brand-ink-soft transition-colors hover:text-brand-gold"
          >
            <InstagramIcon />
          </a>
          <Link
            href="/account"
            aria-label="My account"
            className="text-brand-ink-soft transition-colors hover:text-brand-gold"
          >
            <User className="h-5 w-5" />
          </Link>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
