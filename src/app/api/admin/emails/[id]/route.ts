import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { EmailCampaignModel } from "@/lib/models/email";
import {
  CampaignPayloadError,
  parseCampaignInput,
} from "@/lib/email/campaign-payload";
import { describeSegment } from "@/lib/email/audience";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/emails/:id — update a draft campaign. */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Email not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const input = parseCampaignInput(body);
    await connectDb();
    const campaign = await EmailCampaignModel.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: "Email not found." }, { status: 404 });
    }
    if (campaign.status !== "draft") {
      return NextResponse.json(
        { error: "Only drafts can be edited." },
        { status: 409 },
      );
    }
    const description = await describeSegment(input.segment);
    await EmailCampaignModel.updateOne(
      { _id: id },
      { $set: { ...input, segmentDescription: description } },
    );
    return NextResponse.json({ ok: true });
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
