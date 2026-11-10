import mongoose, { Schema, type Model } from "mongoose";
import type {
  EmailSegment,
  EmailSegmentType,
} from "@/lib/email/segments";

export type CampaignStatus =
  | "draft"
  | "queued"
  | "sending"
  | "sent"
  | "paused"
  | "failed";

export type RecipientStatus = "queued" | "sending" | "sent" | "failed" | "skipped";

export interface EmailCampaignDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  html: string;
  segment: EmailSegment;
  segmentDescription: string;
  status: CampaignStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  createdBy: string;
  lastError?: string;
  queuedAt?: Date;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailCampaignSchema = new Schema<EmailCampaignDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, required: true, trim: true, maxlength: 180 },
    html: { type: String, required: true },
    segment: {
      type: {
        type: String,
        enum: [
          "customers",
          "users",
          "all_contacts",
          "product",
          "category",
          "ring_type",
          "preorder",
          "repeat",
          "abandoned",
        ] satisfies EmailSegmentType[],
        required: true,
      },
      productId: String,
      categoryId: String,
      ringType: { type: String, enum: ["engagement", "female", "male"] },
      days: Number,
    },
    segmentDescription: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "queued", "sending", "sent", "paused", "failed"],
      default: "draft",
    },
    recipientCount: { type: Number, default: 0, min: 0 },
    sentCount: { type: Number, default: 0, min: 0 },
    failedCount: { type: Number, default: 0, min: 0 },
    skippedCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: String, required: true },
    lastError: String,
    queuedAt: Date,
    startedAt: Date,
    finishedAt: Date,
  },
  { timestamps: true },
);

EmailCampaignSchema.index({ status: 1, updatedAt: -1 });

export const EmailCampaignModel: Model<EmailCampaignDoc> =
  (mongoose.models.EmailCampaign as Model<EmailCampaignDoc>) ??
  mongoose.model<EmailCampaignDoc>("EmailCampaign", EmailCampaignSchema);

export interface EmailRecipientDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  status: RecipientStatus;
  attempts: number;
  error?: string;
  claimedAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailRecipientSchema = new Schema<EmailRecipientDoc>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "EmailCampaign",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    status: {
      type: String,
      enum: ["queued", "sending", "sent", "failed", "skipped"],
      default: "queued",
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    error: String,
    claimedAt: Date,
    sentAt: Date,
  },
  { timestamps: true },
);

EmailRecipientSchema.index({ campaignId: 1, email: 1 }, { unique: true });
EmailRecipientSchema.index({ campaignId: 1, status: 1, createdAt: 1 });

export const EmailRecipientModel: Model<EmailRecipientDoc> =
  (mongoose.models.EmailRecipient as Model<EmailRecipientDoc>) ??
  mongoose.model<EmailRecipientDoc>("EmailRecipient", EmailRecipientSchema);

export interface MarketingSuppressionDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  reason: "unsubscribe" | "manual";
  sourceCampaignId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketingSuppressionSchema = new Schema<MarketingSuppressionDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    reason: { type: String, enum: ["unsubscribe", "manual"], default: "unsubscribe" },
    sourceCampaignId: String,
  },
  { timestamps: true },
);

export const MarketingSuppressionModel: Model<MarketingSuppressionDoc> =
  (mongoose.models.MarketingSuppression as Model<MarketingSuppressionDoc>) ??
  mongoose.model<MarketingSuppressionDoc>(
    "MarketingSuppression",
    MarketingSuppressionSchema,
  );
