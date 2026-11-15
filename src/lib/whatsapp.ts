/**
 * Support WhatsApp link — DECISIONS 2026-11-16.
 *
 * The number comes from `NEXT_PUBLIC_WHATSAPP_NUMBER` so both the server
 * layout and the client checkout form can build the same link. Local numbers
 * (`0907…`) and international ones (`+234907…`) are both accepted; `wa.me`
 * needs digits only, with the country code and no leading zero.
 */

export const SUPPORT_WHATSAPP_MESSAGE =
  "Hi Sapphire Stones, I'd like help with my order.";

export interface WhatsAppEnv {
  NEXT_PUBLIC_WHATSAPP_NUMBER?: string;
  WHATSAPP_NUMBER?: string;
  [key: string]: string | undefined;
}

/**
 * `wa.me` number or null when unset/invalid. A leading `0` is replaced with
 * Nigeria's `234`, because the store's support line is a Nigerian number and
 * the client supplies it in local form.
 */
export function normalizeWhatsAppNumber(raw: string | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;

  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  // E.164 allows 8–15 digits; anything outside that cannot be a reachable line.
  if (international.length < 8 || international.length > 15) return null;
  return international;
}

export function whatsAppNumber(env: WhatsAppEnv = process.env): string | null {
  return normalizeWhatsAppNumber(
    env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? env.WHATSAPP_NUMBER,
  );
}

export function whatsAppUrl(
  message: string = SUPPORT_WHATSAPP_MESSAGE,
  env: WhatsAppEnv = process.env,
): string | null {
  const number = whatsAppNumber(env);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
