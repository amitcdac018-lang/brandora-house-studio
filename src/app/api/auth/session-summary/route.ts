import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Lightweight endpoint for the header's account dropdown. Kept separate from the storefront
 * layout (same reasoning as /api/cart/count) so that calling auth()/reading cookies here
 * doesn't force every page under that layout to become dynamically rendered just to know
 * whether to show "Sign In" or the account dropdown.
 *
 * MUST be force-dynamic + no-store: this response depends on the caller's session cookie,
 * so a cached response (CDN or browser) would show one visitor's logged-in/out state to a
 * completely different visitor — exactly the "I'm signed in but it still shows Sign In" bug.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    {
      authenticated: true,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
