import { describe, it, expect } from "vitest";
import {
  canonicalRedirectTarget,
  requestHostname,
  resolveCanonicalOrigin,
} from "@/lib/canonical-host";

const canonical = new URL("https://sapphirestones.online");

describe("resolveCanonicalOrigin", () => {
  it("prefers AUTH_URL and falls back to APP_URL", () => {
    expect(
      resolveCanonicalOrigin({
        AUTH_URL: "https://sapphirestones.online",
        APP_URL: "https://other.example",
      })?.hostname,
    ).toBe("sapphirestones.online");
    expect(
      resolveCanonicalOrigin({ APP_URL: "https://fallback.example" })?.hostname,
    ).toBe("fallback.example");
  });

  it("ignores missing, invalid and plain-http origins", () => {
    expect(resolveCanonicalOrigin({})).toBeNull();
    expect(resolveCanonicalOrigin({ AUTH_URL: "not a url" })).toBeNull();
    expect(
      resolveCanonicalOrigin({ AUTH_URL: "http://localhost:3000" }),
    ).toBeNull();
  });
});

describe("requestHostname", () => {
  it("takes the first forwarded host and drops the port", () => {
    expect(requestHostname("Example.com:8080, proxy", "ignored")).toBe(
      "example.com",
    );
    expect(requestHostname(null, "localhost:3000")).toBe("localhost");
  });

  it("returns null when no host is present", () => {
    expect(requestHostname(null, null)).toBeNull();
    expect(requestHostname(" , ", null)).toBeNull();
  });
});

describe("canonicalRedirectTarget", () => {
  const base = {
    canonicalOrigin: canonical,
    method: "GET",
    accept: "text/html,application/xhtml+xml",
    pathname: "/sign-in",
    search: "?next=%2Faccount",
  };

  it("moves a page load from another host to the canonical origin", () => {
    expect(
      canonicalRedirectTarget({
        ...base,
        hostname: "www.sapphirestones.online",
      })?.toString(),
    ).toBe("https://sapphirestones.online/sign-in?next=%2Faccount");
    expect(
      canonicalRedirectTarget({
        ...base,
        hostname: "sapphirestone.on.helicarrier.xyz",
      })?.hostname,
    ).toBe("sapphirestones.online");
  });

  it("leaves the canonical host alone", () => {
    expect(
      canonicalRedirectTarget({ ...base, hostname: "sapphirestones.online" }),
    ).toBeNull();
  });

  it("never bounces API calls, webhooks or probes", () => {
    expect(
      canonicalRedirectTarget({ ...base, hostname: "www.sapphirestones.online", method: "POST" }),
    ).toBeNull();
    expect(
      canonicalRedirectTarget({
        ...base,
        hostname: "www.sapphirestones.online",
        accept: "*/*",
      }),
    ).toBeNull();
  });

  it("skips single-label hosts such as localhost", () => {
    expect(
      canonicalRedirectTarget({ ...base, hostname: "localhost" }),
    ).toBeNull();
  });

  it("keeps HEAD page requests", () => {
    expect(
      canonicalRedirectTarget({
        ...base,
        hostname: "www.sapphirestones.online",
        method: "HEAD",
      }),
    ).not.toBeNull();
  });
});
