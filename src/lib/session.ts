import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin session: an HMAC-signed cookie. No external auth dependency.
 * Payload: { sub, exp } — signed with ADMIN_SESSION_SECRET (§6.1, §14.2).
 */

export const SESSION_COOKIE = "sapphire_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}

function sign(payload: string): string {
  const key = secret();
  if (!key) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set (min 16 chars). See .env.example.",
    );
  }
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export interface SessionPayload {
  sub: string;
  exp: number;
}

export function encodeSession(sub: string): string {
  const payload: SessionPayload = {
    sub,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${json}.${sign(json)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;
  let expected: string;
  try {
    expected = sign(json);
  } catch {
    // Missing/too-short secret: treat as signed out rather than crashing.
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(json, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(sub: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(sub), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}
