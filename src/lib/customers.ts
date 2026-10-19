import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import {
  CustomerModel,
  PasswordResetTokenModel,
  type CustomerDoc,
} from "@/lib/models/customer";
import { sendPasswordResetEmail } from "@/lib/email";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export class AccountError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AccountError";
    this.status = status;
  }
}

export interface PublicCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredCurrency: "USD" | "NGN";
}

export function toPublicCustomer(doc: {
  _id: unknown;
  name: string;
  email: string;
  phone?: string | null;
  preferredCurrency?: string | null;
}): PublicCustomer {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone || undefined,
    preferredCurrency: doc.preferredCurrency === "NGN" ? "NGN" : "USD",
  };
}

/**
 * Create a customer account with an email + password. The email is
 * normalized; the password is hashed with bcrypt (cost 12) and never stored
 * in plaintext. Sign-in afterwards goes through Auth.js Credentials.
 */
export async function createCustomer(input: {
  name: unknown;
  email: unknown;
  password: unknown;
}): Promise<PublicCustomer> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (name.length < 2) throw new AccountError("Enter your full name.");
  if (!EMAIL_RE.test(email)) throw new AccountError("Enter a valid email address.");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AccountError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  await connectDb();
  const existing = await CustomerModel.findOne({ email }).lean();
  if (existing) {
    throw new AccountError(
      "An account with this email already exists. Try signing in instead.",
      409,
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const doc = await CustomerModel.create({ name, email, passwordHash });
  return toPublicCustomer(doc);
}

/** Find a customer by id (valid ObjectId string or null). */
export async function getCustomerById(id: string): Promise<PublicCustomer | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  try {
    await connectDb();
    const doc = await CustomerModel.findById(id).lean();
    return doc ? toPublicCustomer(doc) : null;
  } catch {
    return null;
  }
}

/**
 * Start a password reset. Always resolves without throwing for unknown
 * emails (no account enumeration); the email is only sent when an account
 * exists. Tokens are random 32-byte values; only their SHA-256 hash is
 * stored, single-use, expiring in one hour.
 */
export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new AccountError("Enter a valid email address.");
  }
  await connectDb();
  const customer = await CustomerModel.findOne({ email }).lean();
  if (!customer) return;

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await PasswordResetTokenModel.create({
    customerId: customer._id,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  const base = process.env.APP_URL ?? "http://localhost:3000";
  const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  await sendPasswordResetEmail(email, resetUrl);
}

/**
 * Complete a password reset. Verifies the token hash, marks it used, and
 * sets the new password. Google-only accounts (no prior password) can also
 * set a password this way.
 */
export async function resetPassword(input: {
  token: unknown;
  password: unknown;
}): Promise<void> {
  const token = typeof input.token === "string" ? input.token : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!token) throw new AccountError("This reset link is invalid or has expired.");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AccountError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await connectDb();
  const record = await PasswordResetTokenModel.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!record) {
    throw new AccountError("This reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await CustomerModel.updateOne(
    { _id: record.customerId },
    { $set: { passwordHash } },
  );
  record.usedAt = new Date();
  await record.save();
  // Drop any other outstanding tokens for this account.
  await PasswordResetTokenModel.deleteMany({
    customerId: record.customerId,
    _id: { $ne: record._id },
  });
}

/** Update the signed-in customer's profile fields. */
export async function updateCustomerProfile(
  id: string,
  input: { name?: unknown; phone?: unknown; preferredCurrency?: unknown },
): Promise<PublicCustomer> {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new AccountError("Not signed in.", 401);
  await connectDb();
  const customer = (await CustomerModel.findById(id)) as CustomerDoc | null;
  if (!customer) throw new AccountError("Account not found.", 404);

  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (name.length < 2) throw new AccountError("Enter your full name.");
    customer.name = name;
  }
  if (input.phone !== undefined) {
    customer.phone = String(input.phone).trim() || undefined;
  }
  if (input.preferredCurrency !== undefined) {
    customer.preferredCurrency =
      input.preferredCurrency === "NGN" ? "NGN" : "USD";
  }
  await customer.save();
  return toPublicCustomer(customer);
}
