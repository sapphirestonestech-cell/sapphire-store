import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { EmailCampaignModel } from "@/lib/models/email";
import { processCampaign } from "@/lib/email/queue";

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/emails/:id/process — advance a bounded sending batch. */
export async function POST(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Email not found." }, { status: 404 });
  }

  try {
    await connectDb();
    const exists = await EmailCampaignModel.exists({ _id: id });
    if (!exists) {
      return NextResponse.json({ error: "Email not found." }, { status: 404 });
    }
    await processCampaign(id);
    const campaign = await EmailCampaignModel.findById(id)
      .select(
        "status recipientCount sentCount failedCount skippedCount queuedAt startedAt finishedAt lastError",
      )
      .lean();
    return NextResponse.json(
      { campaign },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Sending could not continue. Try again shortly." },
      { status: 503 },
    );
  }
}
