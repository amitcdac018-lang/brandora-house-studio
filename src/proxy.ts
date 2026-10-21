import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const ADMIN_PREFIX = "/admin";
const ACCOUNT_PREFIX = "/account";

// On Vercel, a dynamically-rendered route executes as a Function, and the Function's own
// response headers take precedence over headers set in next.config.ts (and even vercel.json)
// for that response — both are silently dropped. The proxy runs for every matched request
// regardless of static/dynamic rendering, so it's the one place that reliably applies these
// headers everywhere. next.config.ts's headers() is left in place too since it still covers
// genuinely static routes and local/non-Vercel hosting.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://placehold.co",
  "connect-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com",
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS: [string, string][] = [
  ["Content-Security-Policy", contentSecurityPolicy],
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(self)"],
];

/**
 * Per Next.js's own documented pattern for setting headers from Proxy (see
 * content-security-policy.md), headers must be set on BOTH the request headers passed into
 * NextResponse.next()/redirect() AND the response's own headers — setting only the latter
 * (what we tried first) was silently dropped for dynamically-rendered routes in production.
 */
function withSecurityHeaders(request: NextRequest, build: (requestHeaders: Headers) => NextResponse): NextResponse {
  const requestHeaders = new Headers(request.headers);
  for (const [key, value] of SECURITY_HEADERS) {
    requestHeaders.set(key, value);
  }

  const response = build(requestHeaders);
  for (const [key, value] of SECURITY_HEADERS) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Protected pages must never be served from the browser's back/forward cache (bfcache) —
 * otherwise pressing Back after signing out (or after a session expires) can briefly show
 * a stale snapshot of an authenticated page instead of re-running this auth check. Forcing
 * no-store means Back/Forward always re-requests the page and gets a fresh redirect decision.
 */
function withNoStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PREFIX) && !pathname.startsWith(ACCOUNT_PREFIX)) {
    return withSecurityHeaders(request, (requestHeaders) =>
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withSecurityHeaders(request, () => withNoStore(NextResponse.redirect(loginUrl)));
  }

  if (pathname.startsWith(ADMIN_PREFIX) && session.user.role !== "ADMIN") {
    return withSecurityHeaders(request, () => withNoStore(NextResponse.redirect(new URL("/", request.url))));
  }

  return withSecurityHeaders(request, (requestHeaders) =>
    withNoStore(NextResponse.next({ request: { headers: requestHeaders } }))
  );
}

export const config = {
  matcher: [
    // Run on every request except static assets, image optimization, and favicon —
    // those are served directly and don't need these headers attached by the proxy.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
