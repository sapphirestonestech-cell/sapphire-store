import crypto from "node:crypto";
import { connectDb } from "@/lib/db";
import { HARD_LINE_CAP } from "@/lib/cart";
import { ProductModel } from "@/lib/models/product";
import { DeliveryLocationModel } from "@/lib/models/settings";
import { getSettings } from "@/lib/settings";
import {
  computeOrderTotals,
  type CheckoutItemInput,
} from "@/lib/checkout";
import { OrderModel, type OrderDoc } from "@/lib/models/order";
import type { Currency } from "@/lib/currency";

/** Error carrying an HTTP status for the route handler to surface. */
export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

export interface RawOrderItem {
  productId: string;
  sizeLabel: string;
  quantity: number;
}

export interface PlaceOrderInput {
  items: unknown;
  customer: unknown;
  locationId: unknown;
  currency: unknown;
  /** Signed-in customer id (server-derived; never taken from the client). */
  customerId?: string;
}

const MAX_LINE_QUANTITY = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function parseItems(raw: unknown): RawOrderItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new OrderError("Your cart is empty.");
  }
  const seen = new Set<string>();
  const items: RawOrderItem[] = [];
  for (const entry of raw) {
    const v = entry as Record<string, unknown>;
    const productId = typeof v.productId === "string" ? v.productId : "";
    const sizeLabel = typeof v.sizeLabel === "string" ? v.sizeLabel.trim() : "";
    const quantity = Number(v.quantity);
    if (!productId || !sizeLabel || !Number.isFinite(quantity)) {
      throw new OrderError("Your cart contains an item we can't read.");
    }
    const key = `${productId}:${sizeLabel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      productId,
      sizeLabel,
      quantity: Math.min(Math.max(1, Math.round(quantity)), HARD_LINE_CAP),
    });
  }
  return items;
}

function parseCustomer(raw: unknown): {
  name: string;
  email: string;
  phone: string;
  notes?: string;
} {
  const v = (raw ?? {}) as Record<string, unknown>;
  const name = typeof v.name === "string" ? v.name.trim() : "";
  const email = typeof v.email === "string" ? v.email.trim().toLowerCase() : "";
  const phone = typeof v.phone === "string" ? v.phone.trim() : "";
  const notes = typeof v.notes === "string" ? v.notes.trim().slice(0, 500) : "";
  if (name.length < 2) throw new OrderError("Enter your full name.");
  if (!EMAIL_RE.test(email)) throw new OrderError("Enter a valid email address.");
  if (phone.length < 6) throw new OrderError("Enter a phone number for delivery.");
  return { name, email, phone, notes: notes || undefined };
}

function makeOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `SAP-${ymd}-${rand}`;
}

/**
 * Create a pending-payment order from the customer's cart (ProductReq.md
 * §10, §14.2). Prices, fees, arrival dates and the exchange rate are
 * recomputed from the database and frozen onto the order — the client's
 * cart prices are never trusted. Payment verification arrives in a later
 * phase; every order is created as `pending_payment`.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<OrderDoc> {
  const items = parseItems(input.items);
  const customer = parseCustomer(input.customer);
  const currency: Currency = input.currency === "NGN" ? "NGN" : "USD";
  const locationId = typeof input.locationId === "string" ? input.locationId : "";
  if (!OBJECT_ID_RE.test(locationId)) {
    throw new OrderError("Choose a delivery location.");
  }

  await connectDb();

  const [location, settings] = await Promise.all([
    DeliveryLocationModel.findById(locationId).lean(),
    getSettings(),
  ]);
  if (!location || !location.isActive) {
    throw new OrderError("We don't deliver to that location yet.");
  }

  const productIds = items
    .map((i) => i.productId)
    .filter((id) => OBJECT_ID_RE.test(id));
  const products = await ProductModel.find({ _id: { $in: productIds } }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const checkoutItems = items.map((line): CheckoutItemInput => {
    const product = byId.get(line.productId);
    if (!product || product.status !== "published") {
      throw new OrderError("One of the rings in your cart is no longer available.");
    }
    const size = product.sizes.find((s) => s.sizeLabel === line.sizeLabel);
    if (!size) {
      throw new OrderError(
        `${product.name} is no longer available in size ${line.sizeLabel}.`,
      );
    }
    if (product.availability === "in_stock" && size.stockQuantity < line.quantity) {
      throw new OrderError(
        `Only ${size.stockQuantity} of ${product.name} (size ${line.sizeLabel}) left.`,
      );
    }
    if (product.availability === "pre_order") {
      // ProductReq: pre-order quantity is capped by the admin's optional
      // per-order maximum; without one the standard line cap applies.
      const preorderCap = product.preorderMaxQty ?? MAX_LINE_QUANTITY;
      if (line.quantity > preorderCap) {
        throw new OrderError(
          `You can pre-order up to ${preorderCap} of ${product.name}.`,
        );
      }
    }
    const cover = [...product.images].sort((a, b) => a.position - b.position)[0];
    const isDeposit =
      product.availability === "pre_order" && product.paymentMode === "deposit";
    return {
      productId: product._id.toString(),
      name: product.name,
      slug: product.slug,
      sizeLabel: line.sizeLabel,
      quantity: line.quantity,
      unitPriceBase: product.basePrice,
      availability: product.availability,
      preorderArrivalDate: product.preorderArrivalDate
        ? new Date(product.preorderArrivalDate).toISOString()
        : null,
      paymentMode:
        product.availability === "pre_order" ? (product.paymentMode ?? "full") : "full",
      depositPercent: isDeposit ? (product.depositPercent ?? 0) : 0,
      freeDelivery: {
        allLocations: product.freeDelivery?.allLocations ?? false,
        locationIds: (product.freeDelivery?.locationIds ?? []).map(String),
      },
      imageUrl: cover?.url,
    };
  });

  const totals = computeOrderTotals(checkoutItems, {
    id: location._id.toString(),
    country: location.country,
    region: location.region,
    cityArea: location.cityArea,
    instockFee: location.instockFee,
    preorderFee: location.preorderFee,
    minDays: location.minDays,
    maxDays: location.maxDays,
  });

  const base = {
    status: "pending_payment" as const,
    customerId: input.customerId && OBJECT_ID_RE.test(input.customerId) ? input.customerId : undefined,
    customer,
    location: {
      locationId: location._id.toString(),
      country: location.country,
      region: location.region,
      cityArea: location.cityArea,
      minDays: location.minDays,
      maxDays: location.maxDays,
    },
    currency,
    baseCurrency: settings.baseCurrency,
    exchangeRate: Number(settings.usdToNgn) || 0,
    items: totals.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      slug: i.slug,
      sizeLabel: i.sizeLabel,
      quantity: i.quantity,
      availability: i.availability,
      preorderArrivalDate: i.preorderArrivalDate
        ? new Date(i.preorderArrivalDate)
        : undefined,
      paymentMode: i.paymentMode,
      depositPercent: i.depositPercent,
      imageUrl: i.imageUrl,
      unitPriceMinor: i.unitPriceMinor,
      lineTotalMinor: i.lineTotalMinor,
      dueNowMinor: i.dueNowMinor,
      dueLaterMinor: i.dueLaterMinor,
    })),
    shipments: totals.shipments.map((s) => ({
      kind: s.kind,
      arrivalDate: s.arrivalDate ? new Date(s.arrivalDate) : undefined,
      itemIndexes: s.itemIndexes,
      deliveryFeeMinor: s.deliveryFeeMinor,
      freeDelivery: s.freeDelivery,
      minDays: s.minDays,
      maxDays: s.maxDays,
    })),
    subtotalMinor: totals.subtotalMinor,
    deliveryTotalMinor: totals.deliveryTotalMinor,
    totalMinor: totals.totalMinor,
    amountDueNowMinor: totals.amountDueNowMinor,
    amountDueLaterMinor: totals.amountDueLaterMinor,
  };

  // Order numbers are random, so a clash is vanishingly rare; retry anyway.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await OrderModel.create({ ...base, orderNumber: makeOrderNumber() });
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code !== 11000) throw err;
    }
  }
  throw new OrderError("We couldn't place your order. Please try again.", 500);
}

/** Fetch one order by its number (public confirmation page). */
export async function getOrderByNumber(orderNumber: string): Promise<OrderDoc | null> {
  if (!/^SAP-\d{8}-[A-F0-9]{6}$/.test(orderNumber)) return null;
  try {
    await connectDb();
    const doc = await OrderModel.findOne({ orderNumber }).lean();
    return doc ? (doc as unknown as OrderDoc) : null;
  } catch {
    return null;
  }
}

/**
 * Orders belonging to a signed-in customer: matched by the stamped
 * customerId, or by the account email (covers orders placed as a guest
 * with the same address before signing up).
 */
export async function getOrdersForCustomer(
  customerId: string,
  email: string,
): Promise<OrderDoc[]> {
  if (!OBJECT_ID_RE.test(customerId)) return [];
  try {
    await connectDb();
    const docs = await OrderModel.find({
      $or: [{ customerId }, { "customer.email": email.toLowerCase() }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return docs as unknown as OrderDoc[];
  } catch {
    return [];
  }
}
