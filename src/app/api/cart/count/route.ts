import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCartItemCount } from "@/lib/data/cart";

/**
 * Lightweight endpoint for the header's cart badge. Kept separate from the storefront layout
 * so that calling auth()/reading cookies here doesn't force every page under that layout
 * (contact, policies, login, etc.) to become dynamically rendered just to show a cart count.
 *
 * MUST be force-dynamic + no-store: this response depends on the caller's session cookie, so
 * a cached response would leak one visitor's cart count to a different visitor.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ count: 0 }, { headers: { "Cache-Control": "no-store" } });
  }

  const count = await getCartItemCount(session.user.id);
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
