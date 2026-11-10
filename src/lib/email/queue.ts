import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import {
  EmailCampaignModel,
  EmailRecipientModel,
  MarketingSuppressionModel,
} from "@/lib/models/email";
import type { EmailCampaignDoc } from "@/lib/models/email";
import { getSettings } from "@/lib/settings";
import { sendMarketingEmail } from "@/lib/email";
import { buildMarketingEmail } from "@/lib/email/template";
import {
  unsubscribeUrlFor,
  isSuppressed,
} from "@/lib/email/unsubscribe";
import type { MarketingContact } from "@/lib/email/audience";

const STALE_CLAIM_MS = 10 * 60 * 1000;
const PAUSE_AFTER_FAILURES = 5;

const drains = new Map<string, Promise<void>>();

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 500);
  return String(error).slice(0, 500);
}

function isFatalSmtpError(message: string): boolean {
  return /daily user sending limit|sending limit exceeded|invalid login|username and password not accepted|application-specific password required|too many login|421|4\.7\.0|5\.7\.1/i.test(
    message,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enqueueCampaign(
  campaignId: string,
  contacts: MarketingContact[],
): Promise<number> {
  await connectDb();
  if (contacts.length > 0) {
    try {
      await EmailRecipientModel.insertMany(
        contacts.map((contact) => ({
          campaignId,
          email: contact.email,
          name: contact.name,
          status: "queued" as const,
        })),
        { ordered: false },
      );
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code !== 11000) throw error;
    }
  }

  await EmailCampaignModel.updateOne(
    { _id: campaignId },
    {
      $set: {
        status: "queued",
        recipientCount: contacts.length,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        queuedAt: new Date(),
        lastError: undefined,
      },
    },
  );

  return contacts.length;
}

async function refreshCampaign(campaignId: string): Promise<void> {
  const id = new mongoose.Types.ObjectId(campaignId);
  const rows = await EmailRecipientModel.aggregate<{ _id: string; count: number }>([
    { $match: { campaignId: id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  const queued = counts.get("queued") ?? 0;
  const sending = counts.get("sending") ?? 0;
  const sent = counts.get("sent") ?? 0;
  const failed = counts.get("failed") ?? 0;
  const skipped = counts.get("skipped") ?? 0;
  const total = queued + sending + sent + failed + skipped;
  const done = queued === 0 && sending === 0;

  const update: Partial<EmailCampaignDoc> = {
    recipientCount: total,
    sentCount: sent,
    failedCount: failed,
    skippedCount: skipped,
  };
  if (done) {
    update.status = "sent";
    update.finishedAt = new Date();
  }

  await EmailCampaignModel.updateOne(
    { _id: campaignId, status: { $in: ["queued", "sending"] } },
    { $set: update },
  );
}

async function runDrain(campaignId: string, max: number): Promise<void> {
  await connectDb();

  await EmailRecipientModel.updateMany(
    {
      campaignId,
      status: "sending",
      claimedAt: { $lt: new Date(Date.now() - STALE_CLAIM_MS) },
    },
    { $set: { status: "queued" } },
  );

  const campaign = await EmailCampaignModel.findById(campaignId);
  if (!campaign || (campaign.status !== "queued" && campaign.status !== "sending")) {
    return;
  }

  if (campaign.status === "queued") {
    await EmailCampaignModel.updateOne(
      { _id: campaignId, status: "queued" },
      { $set: { status: "sending", startedAt: new Date(), lastError: undefined } },
    );
  }

  const settings = await getSettings();
  let processed = 0;
  let consecutiveFailures = 0;

  while (processed < max) {
    const state = await EmailCampaignModel.findById(campaignId)
      .select("status")
      .lean();
    if (!state || state.status !== "sending") break;

    const recipient = await EmailRecipientModel.findOneAndUpdate(
      { campaignId, status: "queued" },
      {
        $set: { status: "sending", claimedAt: new Date() },
        $inc: { attempts: 1 },
      },
      { sort: { createdAt: 1 }, new: true },
    );
    if (!recipient) break;
    processed++;

    try {
      if (await isSuppressed(recipient.email)) {
        await EmailRecipientModel.updateOne(
          { _id: recipient._id },
          { $set: { status: "skipped", error: "Unsubscribed" } },
        );
        consecutiveFailures = 0;
        continue;
      }

      const unsubscribeUrl = unsubscribeUrlFor(recipient.email);
      const { html, text } = buildMarketingEmail({
        storeName: settings.storeName,
        tagline: settings.tagline,
        bodyHtml: campaign.html,
        unsubscribeUrl,
      });
      await sendMarketingEmail(
        recipient.email,
        campaign.subject,
        text,
        html,
        unsubscribeUrl,
      );
      await EmailRecipientModel.updateOne(
        { _id: recipient._id },
        { $set: { status: "sent", sentAt: new Date(), error: undefined } },
      );
      consecutiveFailures = 0;
    } catch (error) {
      const message = errorMessage(error);
      if (isFatalSmtpError(message)) {
        await EmailRecipientModel.updateOne(
          { _id: recipient._id },
          { $set: { status: "queued", error: message }, $inc: { attempts: -1 } },
        );
        await EmailCampaignModel.updateOne(
          { _id: campaignId },
          { $set: { status: "paused", lastError: message } },
        );
        break;
      }

      await EmailRecipientModel.updateOne(
        { _id: recipient._id },
        { $set: { status: "failed", error: message } },
      );
      consecutiveFailures += 1;
      if (consecutiveFailures >= PAUSE_AFTER_FAILURES) {
        await EmailCampaignModel.updateOne(
          { _id: campaignId },
          {
            $set: {
              status: "paused",
              lastError: "Several emails failed in a row. Fix the issue, then resume.",
            },
          },
        );
        break;
      }
    }

    await sleep(150);
  }

  await refreshCampaign(campaignId);
}

function ensureDrain(campaignId: string, max: number): Promise<void> {
  const key = String(campaignId);
  const existing = drains.get(key);
  if (existing) return existing;
  const task = runDrain(campaignId, max)
    .catch(async (error) => {
      await EmailCampaignModel.updateOne(
        { _id: campaignId, status: { $in: ["queued", "sending"] } },
        { $set: { status: "paused", lastError: errorMessage(error) } },
      );
    })
    .finally(() => drains.delete(key));
  drains.set(key, task);
  return task;
}

/** Start sending in the background. Called after a campaign is queued. */
export function startCampaignDrain(campaignId: string): void {
  void ensureDrain(campaignId, Number.POSITIVE_INFINITY);
}

/** Process a bounded batch; used by the admin progress poller. */
export async function processCampaign(campaignId: string): Promise<void> {
  if (drains.has(String(campaignId))) return;
  await ensureDrain(campaignId, 20);
}

/** Put a paused campaign back in the queue after the admin fixes the issue. */
export async function resumeCampaign(campaignId: string): Promise<void> {
  await connectDb();
  await EmailCampaignModel.updateOne(
    { _id: campaignId, status: "paused" },
    { $set: { status: "queued", lastError: undefined } },
  );
  startCampaignDrain(campaignId);
}
