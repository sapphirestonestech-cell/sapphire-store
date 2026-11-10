import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { EmailCampaignModel } from "@/lib/models/email";
import {
  CampaignPayloadError,
  parseCampaignInput,
} from "@/lib/email/campaign-payload";
import { describeSegment } from "@/lib/email/audience";

/** POST /api/admin/emails — save a draft campaign. */
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
    const input = parseCampaignInput(body);
    await connectDb();
    const description = await describeSegment(input.segment);
    const campaign = await EmailCampaignModel.create({
      ...input,
      segmentDescription: description,
      createdBy: auth.admin.email,
      status: "draft",
    });
    return NextResponse.json({ id: String(campaign._id) }, { status: 201 });
  } catch (error) {
    if (error instanceof CampaignPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "The email could not be saved. Try again shortly." },
      { status: 503 },
    );
  }
}
