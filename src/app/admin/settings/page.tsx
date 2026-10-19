import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/admin/settings-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Site Settings" };

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSetting.findMany();
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Site Settings</h1>
      <div className="mt-6 max-w-xl">
        <SettingsForm
          initialValues={{
            instagram_url: settingsMap.instagram_url ?? siteConfig.instagramUrl,
            support_email: settingsMap.support_email ?? siteConfig.supportEmail,
            support_phone: settingsMap.support_phone ?? siteConfig.supportPhone,
          }}
        />
      </div>
    </div>
  );
}
