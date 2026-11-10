import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { EmailCampaignModel } from "@/lib/models/email";
import { resumeCampaign } from "@/lib/email/queue";

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/emails/:id/resume — resume a paused campaign. */
export async function POST(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Email not found." }, { status: 404 });
  }

  await connectDb();
  const campaign = await EmailCampaignModel.findById(id);
  if (!campaign) {
    return NextResponse.json({ error: "Email not found." }, { status: 404 });
  }
  if (campaign.status !== "paused") {
    return NextResponse.json(
      { error: "Only paused emails can be resumed." },
      { status: 409 },
    );
  }
  await resumeCampaign(id);
  return NextResponse.json({ ok: true });
}
