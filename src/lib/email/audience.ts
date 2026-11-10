import mongoose from "mongoose";
import { type OrderFilter } from "@/lib/admin/orders";
import { connectDb } from "@/lib/db";
import { CustomerModel } from "@/lib/models/customer";
import { OrderModel } from "@/lib/models/order";
import { ProductModel } from "@/lib/models/product";
import { CategoryModel } from "@/lib/models/category";
import { MarketingSuppressionModel } from "@/lib/models/email";
import {
  DEFAULT_ABANDONED_DAYS,
  segmentDescription,
  type EmailSegment,
} from "@/lib/email/segments";

export const PAID_ORDER_STATUSES = [
  "paid",
  "processing",
  "shipped",
  "delivered",
] as const;

export interface MarketingContact {
  email: string;
  name?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function dedupeContacts(rows: MarketingContact[]): MarketingContact[] {
  const byEmail = new Map<string, MarketingContact>();
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!isValidEmail(email)) continue;
    const existing = byEmail.get(email);
    if (!existing) {
      byEmail.set(email, { email, name: row.name?.trim() || undefined });
      continue;
    }
    if (!existing.name && row.name?.trim()) existing.name = row.name.trim();
  }
  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

interface BuyerRow {
  _id: string;
  name?: string;
  orders: number;
}

function paidFilter(extra: OrderFilter = {}): OrderFilter {
  return {
    status: { $in: PAID_ORDER_STATUSES },
    paymentMode: { $ne: "test" },
    ...extra,
  };
}

async function buyerRows(
  extra: OrderFilter = {},
): Promise<BuyerRow[]> {
  return OrderModel.aggregate<BuyerRow>([
    { $match: paidFilter(extra) },
    {
      $group: {
        _id: { $toLower: "$customer.email" },
        name: { $first: "$customer.name" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

async function productIdsFor(
  filter: Record<string, unknown>,
): Promise<string[]> {
  const docs = await ProductModel.find(filter).select("_id").lean();
  return docs.map((doc) => String(doc._id));
}

async function suppressedEmails(emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const docs = await MarketingSuppressionModel.find({ email: { $in: emails } })
    .select("email")
    .lean();
  return new Set(docs.map((doc) => normalizeEmail(doc.email)));
}

export async function describeSegment(segment: EmailSegment): Promise<string> {
  await connectDb();
  let productName: string | undefined;
  let categoryName: string | undefined;
  if (segment.type === "product" && segment.productId) {
    const product = await ProductModel.findById(segment.productId)
      .select("name")
      .lean();
    productName = product?.name;
  }
  if (segment.type === "category" && segment.categoryId) {
    const category = await CategoryModel.findById(segment.categoryId)
      .select("name")
      .lean();
    categoryName = category?.name;
  }
  return segmentDescription(segment, { productName, categoryName });
}

/**
 * Resolve the admin's segment against live data. Test orders are always
 * excluded; unsubscribed and invalid addresses are removed before counting.
 */
export async function resolveAudience(segment: EmailSegment): Promise<{
  contacts: MarketingContact[];
  description: string;
}> {
  await connectDb();

  let contacts: MarketingContact[] = [];
  let productName: string | undefined;
  let categoryName: string | undefined;

  if (segment.type === "users") {
    const users = await CustomerModel.find().select("email name").lean();
    const buyers = await buyerRows();
    const buyerEmails = new Set(buyers.map((row) => row._id));
    contacts = users
      .filter((user) => !buyerEmails.has(normalizeEmail(user.email)))
      .map((user) => ({ email: user.email, name: user.name }));
  } else if (segment.type === "all_contacts") {
    const [buyers, users] = await Promise.all([
      buyerRows(),
      CustomerModel.find().select("email name").lean(),
    ]);
    contacts = dedupeContacts([
      ...buyers.map((row) => ({ email: row._id, name: row.name })),
      ...users.map((user) => ({ email: user.email, name: user.name })),
    ]);
  } else if (segment.type === "abandoned") {
    const days = segment.days ?? DEFAULT_ABANDONED_DAYS;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await OrderModel.aggregate<BuyerRow>([
      {
        $match: {
          status: "pending_payment",
          paymentMode: { $ne: "test" },
          createdAt: { $gte: since },
          $or: [
            { paymentReference: { $exists: true, $nin: ["", null] } },
            { paymentCheckoutId: { $exists: true, $nin: ["", null] } },
            { paymentStatus: { $in: ["initiated", "failed"] } },
          ],
        },
      },
      {
        $group: {
          _id: { $toLower: "$customer.email" },
          name: { $first: "$customer.name" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    contacts = rows.map((row) => ({ email: row._id, name: row.name }));
  } else if (segment.type === "product") {
    if (!segment.productId || !mongoose.isValidObjectId(segment.productId)) {
      return { contacts: [], description: "Customers who bought a product" };
    }
    const product = await ProductModel.findById(segment.productId)
      .select("name")
      .lean();
    productName = product?.name;
    const rows = await buyerRows({ "items.productId": segment.productId });
    contacts = rows.map((row) => ({ email: row._id, name: row.name }));
  } else if (segment.type === "category") {
    if (!segment.categoryId || !mongoose.isValidObjectId(segment.categoryId)) {
      return {
        contacts: [],
        description: "Customers who bought from a category",
      };
    }
    const category = await CategoryModel.findById(segment.categoryId)
      .select("name")
      .lean();
    categoryName = category?.name;
    const ids = await productIdsFor({ categories: segment.categoryId });
    if (ids.length === 0) {
      return {
        contacts: [],
        description: segmentDescription(segment, { categoryName }),
      };
    }
    const rows = await buyerRows({ "items.productId": { $in: ids } });
    contacts = rows.map((row) => ({ email: row._id, name: row.name }));
  } else if (segment.type === "ring_type") {
    const ringType = segment.ringType ?? "engagement";
    const ids = await productIdsFor({ type: ringType });
    if (ids.length === 0) {
      return {
        contacts: [],
        description: segmentDescription({ ...segment, ringType }),
      };
    }
    const rows = await buyerRows({ "items.productId": { $in: ids } });
    contacts = rows.map((row) => ({ email: row._id, name: row.name }));
  } else if (segment.type === "preorder") {
    const rows = await buyerRows({
      items: { $elemMatch: { availability: "pre_order" } },
    });
    contacts = rows.map((row) => ({ email: row._id, name: row.name }));
  } else if (segment.type === "repeat") {
    const rows = await buyerRows();
    contacts = rows
      .filter((row) => row.orders >= 2)
      .map((row) => ({ email: row._id, name: row.name }));
  } else {
    const rows = await buyerRows();
    contacts = rows.map((row) => ({ email: row._id, name: row.name }));
  }

  const deduped = dedupeContacts(contacts);
  const suppressed = await suppressedEmails(deduped.map((c) => c.email));
  const filtered = deduped.filter((c) => !suppressed.has(c.email));

  return {
    contacts: filtered,
    description: segmentDescription(segment, { productName, categoryName }),
  };
}
