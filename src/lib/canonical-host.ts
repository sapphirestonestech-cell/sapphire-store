/**
 * Canonical-origin redirects — added 2026-11-15 to fix Google sign-in.
 *
 * Auth.js builds every OAuth URL (and the PKCE cookie's host scope) from one
 * fixed origin: `AUTH_URL`. Cookies are host-only, so starting a sign-in on
 * another hostname (www.sapphirestones.online, or the raw
 * *.on.helicarrier.xyz address) sets the PKCE cookie on that host while Google
 * sends the browser back to the `AUTH_URL` host, where the cookie does not
 * exist. Auth.js then fails with
 * `InvalidCheck: pkceCodeVerifier value could not be parsed`.
 *
 * Sending page navigations to the canonical origin keeps the whole flow on one
 * host, which is also what the OAuth client's registered redirect URI expects.
 */

/** The public origin the auth flow runs on, from `AUTH_URL` then `APP_URL`. */
export function resolveCanonicalOrigin(
  env: Record<string, string | undefined> = process.env,
): URL | null {
  const raw = env.AUTH_URL || env.APP_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    // Only force https origins: a local http origin (localhost, LAN tunnel)
    // must never win a redirect when the app is opened from another address.
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** First entry of a possibly comma-separated forwarded host, lowercased. */
export function requestHostname(
  forwardedHost: string | null,
  host: string | null,
): string | null {
  const raw = (forwardedHost ?? host ?? "").split(",")[0]?.trim().toLowerCase();
  if (!raw) return null;
  // Strip the port ("host:3000"), keeping bracketed IPv6 addresses intact.
  const hostname = raw.startsWith("[")
    ? raw.slice(0, raw.indexOf("]") + 1)
    : raw.replace(/:\d+$/, "");
  return hostname || null;
}

export interface CanonicalRedirectInput {
  canonicalOrigin: URL;
  hostname: string | null;
  method: string;
  accept: string | null;
  pathname: string;
  search: string;
}

/**
 * The URL to redirect to, or null when the request should be served as-is.
 *
 * Only document navigations move: API calls, webhooks and health probes keep
 * whatever host they were sent to, so nothing that is not a browser page load
 * is ever bounced.
 */
export function canonicalRedirectTarget({
  canonicalOrigin,
  hostname,
  method,
  accept,
  pathname,
  search,
}: CanonicalRedirectInput): URL | null {
  if (method !== "GET" && method !== "HEAD") return null;
  if (!accept || !accept.toLowerCase().includes("text/html")) return null;
  if (!hostname) return null;
  if (hostname === canonicalOrigin.hostname.toLowerCase()) return null;
  // Single-label hosts are localhost and friends; never redirect those.
  if (!hostname.includes(".")) return null;

  const target = new URL(canonicalOrigin.origin);
  target.pathname = pathname;
  target.search = search;
  return target;
}
