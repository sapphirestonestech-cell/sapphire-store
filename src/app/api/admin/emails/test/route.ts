import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getSettings } from "@/lib/settings";
import {
  CampaignPayloadError,
  parseCampaignInput,
  parseTestEmail,
} from "@/lib/email/campaign-payload";
import { buildMarketingEmail } from "@/lib/email/template";
import { sendMarketingEmail } from "@/lib/email";
import { unsubscribeUrlFor } from "@/lib/email/unsubscribe";

/** POST /api/admin/emails/test — send the current draft to one address. */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const raw = body as Record<string, unknown>;
    const input = parseCampaignInput({
      name: "Test email",
      subject: raw.subject,
      html: raw.html,
      segment: { type: "customers" },
    });
    const email = parseTestEmail(raw.email);
    const settings = await getSettings();
    const unsubscribeUrl = unsubscribeUrlFor(email);
    const { html, text } = buildMarketingEmail({
      storeName: settings.storeName,
      tagline: settings.tagline,
      bodyHtml: input.html,
      unsubscribeUrl,
      isTest: true,
    });
    await sendMarketingEmail(
      email,
      input.subject,
      text,
      html,
      unsubscribeUrl,
      true,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CampaignPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "The test email could not be sent.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
