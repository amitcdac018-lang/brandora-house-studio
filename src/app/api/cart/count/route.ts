import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCartItemCount } from "@/lib/data/cart";

/**
 * Lightweight endpoint for the header's cart badge. Kept separate from the storefront layout
 * so that calling auth()/reading cookies here doesn't force every page under that layout
 * (contact, policies, login, etc.) to become dynamically rendered just to show a cart count.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getCartItemCount(session.user.id);
  return NextResponse.json({ count });
}
