/** Admin account creation rules — §6.1, §12.1. */

export const MIN_ADMIN_PASSWORD_LENGTH = 8;

export interface NewAdminInput {
  email: string;
  password: string;
}

export class AdminPayloadError extends Error {}

export function validateNewAdmin(body: unknown): NewAdminInput {
  if (!body || typeof body !== "object") {
    throw new AdminPayloadError("Enter an email and a password.");
  }

  const { email: rawEmail, password } = body as {
    email?: unknown;
    password?: unknown;
  };

  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!email) {
    throw new AdminPayloadError("Enter the new admin's email.");
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AdminPayloadError("Enter a valid email address.");
  }

  if (typeof password !== "string" || password.length === 0) {
    throw new AdminPayloadError("Set a password for the new admin.");
  }
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new AdminPayloadError(
      `Use at least ${MIN_ADMIN_PASSWORD_LENGTH} characters for the password.`,
    );
  }
  if (password.length > 72) {
    throw new AdminPayloadError("Keep the password under 72 characters.");
  }

  return { email, password };
}

/** The last admin can never be removed, and nobody can remove themselves. */
export function canRemoveAdmin(
  targetId: string,
  currentAdminId: string,
  adminCount: number,
): { allowed: true } | { allowed: false; reason: string } {
  if (targetId === currentAdminId) {
    return { allowed: false, reason: "You can't remove your own account." };
  }
  if (adminCount <= 1) {
    return { allowed: false, reason: "You can't remove the last admin." };
  }
  return { allowed: true };
}
