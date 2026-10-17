/**
 * In-memory login rate limiting with lockout — ProductReq.md §6.1.
 * Suitable for a single-instance deployment; a shared store (e.g. Redis)
 * replaces this when the app scales horizontally.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  firstAt: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

export function checkLoginAllowed(key: string): { allowed: boolean; retryAfterMs?: number } {
  const rec = attempts.get(key);
  if (!rec) return { allowed: true };
  const now = Date.now();
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return { allowed: false, retryAfterMs: rec.lockedUntil - now };
  }
  if (rec.lockedUntil && rec.lockedUntil <= now) {
    attempts.delete(key);
    return { allowed: true };
  }
  if (now - rec.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true };
  }
  return { allowed: true };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now, lockedUntil: null });
    return;
  }
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = now + LOCKOUT_MS;
  }
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
