import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// Admin data (orders, stock, customers) changes constantly and must never be
// served from a stale build-time snapshot — always render fresh per-request.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between bg-brand-ink px-4 py-2 text-xs text-brand-cream/80 sm:px-6">
        <span>
          Signed in as <span className="font-medium text-brand-gold-soft">{session.user.email}</span> · Admin Mode
        </span>
        <Link href="/" className="font-medium text-brand-gold hover:underline">
          View storefront →
        </Link>
      </div>
      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 bg-brand-cream p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
