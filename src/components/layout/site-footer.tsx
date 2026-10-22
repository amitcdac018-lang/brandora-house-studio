import Link from "next/link";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { siteConfig } from "@/lib/site-config";

const policyLinks = [
  { href: "/policies/privacy", label: "Privacy Policy" },
  { href: "/policies/terms", label: "Terms & Conditions" },
  { href: "/policies/shipping", label: "Shipping Policy" },
  { href: "/policies/cancellation", label: "Cancellation Policy" },
  { href: "/policies/returns", label: "Return & Refund Policy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-brand-cream-dark bg-brand-ink text-brand-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl">Brandora House Studio</p>
            <p className="mt-2 text-sm text-brand-cream/70">{siteConfig.tagline}</p>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-brand-gold-soft hover:text-brand-gold"
            >
              <InstagramIcon className="h-4 w-4" />
              @brandora_house_studio
            </a>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold-soft">Shop</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-cream/80">
              <li><Link href="/shop" className="hover:text-brand-gold">All Products</Link></li>
              <li><Link href="/shop?brand=campus" className="hover:text-brand-gold">Campus</Link></li>
              <li><Link href="/shop?brand=nike" className="hover:text-brand-gold">Nike</Link></li>
              <li><Link href="/shop?brand=aqualite" className="hover:text-brand-gold">Aqualite</Link></li>
              <li><Link href="/shop?brand=action-shoes" className="hover:text-brand-gold">Action Shoes</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold-soft">Policies</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-cream/80">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-gold">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold-soft">Support</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-cream/80">
              <li><Link href="/contact" className="hover:text-brand-gold">Contact Us</Link></li>
              <li>{siteConfig.supportEmail}</li>
              <li>{siteConfig.supportPhone}</li>
              <li>
                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-brand-gold"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-brand-cream/50">
          &copy; {new Date().getFullYear()} Brandora House Studio. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
