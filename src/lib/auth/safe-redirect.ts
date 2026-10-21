/**
 * callbackUrl is attacker-controlled (a query param anyone can set), so it must never
 * be passed straight to redirect()/router.replace() — otherwise ?callbackUrl=https://evil.com
 * would turn our own login/register page into an open redirect. Only allow a same-site,
 * root-relative path.
 */
export function toSafeRedirectPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value) return fallback;
  // Must start with a single "/" — rules out "//evil.com" (protocol-relative) and
  // "https://evil.com" alike, while still allowing "/account", "/product/foo?x=1", etc.
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
