import type { Metadata } from "next";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-brand-ink">Contact Us</h1>
      <p className="mt-2 text-brand-ink-soft">
        We&apos;re here to help with orders, returns, sizing, and anything else.
      </p>

      <div className="mt-8 space-y-4 rounded-xl border border-brand-cream-dark bg-white p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">Email</p>
          <p className="mt-1 text-brand-ink">{siteConfig.supportEmail}</p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">Phone</p>
          <p className="mt-1 text-brand-ink">{siteConfig.supportPhone}</p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">WhatsApp</p>
          <a
            href={siteConfig.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-2 text-brand-ink hover:text-brand-gold"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chat with us
          </a>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">Instagram</p>
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-2 text-brand-ink hover:text-brand-gold"
          >
            <InstagramIcon className="h-4 w-4" />
            @brandora_house_studio
          </a>
        </div>
      </div>
    </div>
  );
}
