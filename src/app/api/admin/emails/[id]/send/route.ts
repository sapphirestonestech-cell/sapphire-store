import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { EmailCampaignModel } from "@/lib/models/email";
import { resolveAudience } from "@/lib/email/audience";
import {
  enqueueCampaign,
  startCampaignDrain,
} from "@/lib/email/queue";

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/emails/:id/send — freeze the audience and start sending. */
export async function POST(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Email not found." }, { status: 404 });
  }

  try {
    await connectDb();
    const campaign = await EmailCampaignModel.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: "Email not found." }, { status: 404 });
    }
    if (campaign.status !== "draft") {
      return NextResponse.json(
        { error: "This email has already been queued." },
        { status: 409 },
      );
    }

    const { contacts, description } = await resolveAudience(campaign.segment);
    if (contacts.length === 0) {
      return NextResponse.json(
        {
          error:
            "No one is in this audience right now. Change the segment or check back later.",
        },
        { status: 400 },
      );
    }

    const claimed = await EmailCampaignModel.findOneAndUpdate(
      { _id: id, status: "draft" },
      { $set: { status: "queued", queuedAt: new Date() } },
      { new: true },
    );
    if (!claimed) {
      return NextResponse.json(
        { error: "This email has already been queued." },
        { status: 409 },
      );
    }

    try {
      await enqueueCampaign(id, contacts);
      await EmailCampaignModel.updateOne(
        { _id: id },
        { $set: { segmentDescription: description } },
      );
    } catch (error) {
      await EmailCampaignModel.updateOne(
        { _id: id },
        { $set: { status: "draft" } },
      );
      throw error;
    }

    startCampaignDrain(id);
    return NextResponse.json({ count: contacts.length }, { status: 202 });
  } catch {
    return NextResponse.json(
      { error: "The email could not be queued. Try again shortly." },
      { status: 503 },
    );
  }
}
