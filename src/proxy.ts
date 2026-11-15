import { NextResponse, type NextRequest } from "next/server";
import {
  canonicalRedirectTarget,
  requestHostname,
  resolveCanonicalOrigin,
} from "@/lib/canonical-host";

/**
 * Serve the whole site from one canonical origin — DECISIONS 2026-11-15.
 *
 * Auth.js pins OAuth callbacks to `AUTH_URL`, but it sets the PKCE cookie on
 * whatever host started the sign-in. Visitors on www.sapphirestones.online (or
 * the *.on.helicarrier.xyz address) were landed back on the canonical host
 * without that cookie, so Google sign-in failed with
 * `InvalidCheck: pkceCodeVerifier value could not be parsed`. Bouncing page
 * navigations to the canonical host removes the mismatch.
 *
 * Non-document requests (APIs, gateway webhooks, platform health probes) are
 * left alone: they may be addressed deliberately at a specific host.
 */
export function proxy(request: NextRequest) {
  const canonicalOrigin = resolveCanonicalOrigin();
  if (!canonicalOrigin) return;

  const target = canonicalRedirectTarget({
    canonicalOrigin,
    hostname: requestHostname(
      request.headers.get("x-forwarded-host"),
      request.headers.get("host"),
    ),
    method: request.method,
    accept: request.headers.get("accept"),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
  });

  if (target) return NextResponse.redirect(target, 308);
}

export const config = {
  // Static assets and API routes are excluded: only rendered pages need the
  // canonical host, and skipping assets keeps every request cheap.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
