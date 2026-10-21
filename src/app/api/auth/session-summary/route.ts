import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Lightweight endpoint for the header's account dropdown. Kept separate from the storefront
 * layout (same reasoning as /api/cart/count) so that calling auth()/reading cookies here
 * doesn't force every page under that layout to become dynamically rendered just to know
 * whether to show "Sign In" or the account dropdown.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  });
}
