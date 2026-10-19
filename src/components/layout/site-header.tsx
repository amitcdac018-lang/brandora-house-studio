import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?brand=campus", label: "Campus" },
  { href: "/shop?brand=nike", label: "Nike" },
  { href: "/shop?brand=aqualite", label: "Aqualite" },
  { href: "/shop?brand=action-shoes", label: "Action Shoes" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-cream-dark bg-brand-cream/95 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-brand-ink-soft transition-colors hover:text-brand-gold"
            >
              {link.label}
            </Link>
          ))}
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
          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="text-brand-ink-soft transition-colors hover:text-brand-gold"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
