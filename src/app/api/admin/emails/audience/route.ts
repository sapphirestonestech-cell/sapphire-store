import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import {
  CampaignPayloadError,
  parseSegmentInput,
} from "@/lib/email/campaign-payload";
import { resolveAudience } from "@/lib/email/audience";

/** GET /api/admin/emails/audience — count and sample a segment. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const raw: Record<string, unknown> = { type: sp.get("type") };
  for (const key of ["productId", "categoryId", "ringType", "days"]) {
    const value = sp.get(key);
    if (value !== null) raw[key] = value;
  }

  try {
    const segment = parseSegmentInput(raw);
    const { contacts, description } = await resolveAudience(segment);
    return NextResponse.json(
      {
        count: contacts.length,
        description,
        sample: contacts.slice(0, 5).map((contact) => ({
          email: contact.email,
          name: contact.name ?? null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof CampaignPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "The audience could not be counted. Try again shortly." },
      { status: 503 },
    );
  }
}
