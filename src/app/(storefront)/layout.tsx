import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartUiProvider } from "@/components/cart/cart-ui-context";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartUiProvider>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </CartUiProvider>
  );
}
