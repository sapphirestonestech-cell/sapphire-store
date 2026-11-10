import { createHmac, timingSafeEqual } from "node:crypto";
import { connectDb } from "@/lib/db";
import { MarketingSuppressionModel } from "@/lib/models/email";
import { isValidEmail, normalizeEmail } from "@/lib/email/audience";

function secret(): string {
  return (
    process.env.EMAIL_UNSUBSCRIBE_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "sapphire-development-unsubscribe-secret"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createUnsubscribeToken(email: string): string {
  const payload = Buffer.from(normalizeEmail(email), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const email = normalizeEmail(Buffer.from(payload, "base64url").toString("utf8"));
    return isValidEmail(email) ? email : null;
  } catch {
    return null;
  }
}

export function siteUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function unsubscribeUrlFor(email: string): string {
  return `${siteUrl()}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email))}`;
}

export async function suppressEmail(
  email: string,
  sourceCampaignId?: string,
): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) return;
  await connectDb();
  await MarketingSuppressionModel.updateOne(
    { email: normalized },
    {
      $setOnInsert: {
        email: normalized,
        reason: "unsubscribe",
        sourceCampaignId,
      },
    },
    { upsert: true },
  );
}

export async function isSuppressed(email: string): Promise<boolean> {
  await connectDb();
  const doc = await MarketingSuppressionModel.exists({
    email: normalizeEmail(email),
  });
  return Boolean(doc);
}
