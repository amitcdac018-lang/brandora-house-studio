import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BannerManager } from "@/components/admin/banner-manager";

export const metadata: Metadata = { title: "Homepage Banners" };

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({ orderBy: { position: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Homepage Banners</h1>
      <div className="mt-6">
        <BannerManager initialBanners={banners} />
      </div>
    </div>
  );
}
