"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Truck,
  Image as ImageIcon,
  Settings,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/brands", label: "Brands & Categories", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin navigation" className="space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-ink text-brand-gold-soft"
                : "text-brand-ink-soft hover:bg-brand-cream hover:text-brand-ink"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer automatically whenever navigation completes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile/tablet top bar with drawer toggle — shown below lg, where the fixed sidebar is hidden */}
      <div className="flex items-center justify-between border-b border-brand-cream-dark bg-brand-ink px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-gold" />
          <p className="font-display text-base leading-tight text-brand-gold-soft">Brandora Admin</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          aria-label={open ? "Close admin menu" : "Open admin menu"}
          className="text-brand-gold-soft"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div
          id="admin-mobile-nav"
          className="border-b border-brand-cream-dark bg-white shadow-md lg:hidden"
        >
          <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
        </div>
      )}

      {/* Desktop fixed sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-brand-cream-dark bg-white lg:block">
        <div className="flex items-center gap-2 border-b border-brand-cream-dark bg-brand-ink px-6 py-5">
          <ShieldCheck className="h-5 w-5 text-brand-gold" />
          <div>
            <p className="font-display text-lg leading-tight text-brand-gold-soft">Brandora Admin</p>
            <p className="text-[11px] uppercase tracking-wide text-brand-cream/60">Admin Mode</p>
          </div>
        </div>
        <SidebarNav pathname={pathname} />
      </aside>
    </>
  );
}
