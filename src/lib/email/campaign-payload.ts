import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";
import {
  DEFAULT_ABANDONED_DAYS,
  isEmailSegmentType,
  isRingType,
  type EmailSegment,
} from "@/lib/email/segments";

export class CampaignPayloadError extends Error {}

export interface CampaignInput {
  name: string;
  subject: string;
  html: string;
  segment: EmailSegment;
}

const MAX_HTML = 250_000;

const ALLOWED_TAGS = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "figure",
  "figcaption",
  "hr",
  "span",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel", "title"],
  img: ["src", "alt", "title", "width", "height"],
};

/**
 * CKEditor HTML is untrusted (the API can be called directly), so the stored
 * body is always sanitized. Inline styles and classes are stripped; the email
 * shell owns the presentation.
 */
export function sanitizeCampaignHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    },
  }).trim();
}

function textValue(value: unknown, label: string, max: number): string {
  if (typeof value !== "string") throw new CampaignPayloadError(`${label} is required.`);
  const clean = value.replace(/[\r\n]+/g, " ").trim();
  if (!clean) throw new CampaignPayloadError(`${label} is required.`);
  if (clean.length > max) {
    throw new CampaignPayloadError(`${label} must be ${max} characters or fewer.`);
  }
  return clean;
}

function objectId(value: unknown, label: string): string {
  if (typeof value !== "string" || !mongoose.isValidObjectId(value)) {
    throw new CampaignPayloadError(`Choose a ${label}.`);
  }
  return value;
}

export function parseSegmentInput(value: unknown): EmailSegment {
  if (typeof value !== "object" || value === null) {
    throw new CampaignPayloadError("Choose an audience.");
  }
  const raw = value as Record<string, unknown>;
  if (!isEmailSegmentType(raw.type)) {
    throw new CampaignPayloadError("Choose a valid audience.");
  }

  switch (raw.type) {
    case "product":
      return { type: raw.type, productId: objectId(raw.productId, "ring") };
    case "category":
      return { type: raw.type, categoryId: objectId(raw.categoryId, "category") };
    case "ring_type":
      if (!isRingType(raw.ringType)) {
        throw new CampaignPayloadError("Choose a ring type.");
      }
      return { type: raw.type, ringType: raw.ringType };
    case "abandoned": {
      const parsed = Number(raw.days);
      const days =
        Number.isFinite(parsed) && parsed >= 1 && parsed <= 365
          ? Math.round(parsed)
          : DEFAULT_ABANDONED_DAYS;
      return { type: raw.type, days };
    }
    default:
      return { type: raw.type };
  }
}

export function parseCampaignInput(value: unknown): CampaignInput {
  if (typeof value !== "object" || value === null) {
    throw new CampaignPayloadError("Invalid request.");
  }
  const raw = value as Record<string, unknown>;
  const name = textValue(raw.name, "Campaign name", 120);
  const subject = textValue(raw.subject, "Subject", 180);
  if (typeof raw.html !== "string") {
    throw new CampaignPayloadError("Write the email body.");
  }
  if (raw.html.length > MAX_HTML) {
    throw new CampaignPayloadError("The email body is too large.");
  }
  const html = sanitizeCampaignHtml(raw.html);
  const visible = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  if (!visible && !/<img\b/i.test(html)) {
    throw new CampaignPayloadError("Write the email body.");
  }
  return { name, subject, html, segment: parseSegmentInput(raw.segment) };
}

export function parseTestEmail(value: unknown): string {
  if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw new CampaignPayloadError("Enter a valid test email address.");
  }
  return value.trim().toLowerCase();
}
