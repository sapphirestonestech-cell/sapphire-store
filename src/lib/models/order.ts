import mongoose, { Schema, type Model } from "mongoose";
import type { Currency } from "@/lib/currency";

/**
 * Order — ProductReq.md §10. Created at checkout and frozen: every name,
 * price, fee, arrival date and the exchange rate are snapshotted so later
 * edits to products or settings never change history (AGENTS.md §9).
 *
 * Money is stored as integer **minor units** of the base currency
 * (USD cents, or NGN kobo) to avoid floating-point arithmetic.
 */

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

/** Append-only audit trail for the admin order timeline (§6.7). */
export interface OrderStatusEntry {
  status: OrderStatus;
  at: Date;
  note?: string;
  by?: string;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

/** Delivery location frozen at purchase. */
export interface OrderLocationSnapshot {
  locationId?: string;
  country: string;
  region?: string;
  cityArea: string;
  minDays: number;
  maxDays: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  sizeLabel: string;
  quantity: number;
  availability: "in_stock" | "pre_order";
  preorderArrivalDate?: Date;
  paymentMode: "full" | "deposit";
  depositPercent?: number;
  /** Cover image snapshot (optional, for the confirmation page). */
  imageUrl?: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
  dueNowMinor: number;
  dueLaterMinor: number;
}

export interface OrderShipment {
  kind: "in_stock" | "pre_order";
  arrivalDate?: Date;
  itemIndexes: number[];
  deliveryFeeMinor: number;
  freeDelivery: boolean;
  minDays: number;
  maxDays: number;
}

export interface OrderDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  /** Signed-in customer who placed the order (null for guests). */
  customerId?: string;
  customer: OrderCustomer;
  location: OrderLocationSnapshot;
  /** Currency the customer saw and paid in. */
  currency: Currency;
  /** Currency prices were entered in; all `*Minor` values are in this one. */
  baseCurrency: Currency;
  /** USD→NGN rate at purchase time. */
  exchangeRate: number;
  items: OrderItem[];
  shipments: OrderShipment[];
  /** Status changes made by the admin (and payment verification). */
  statusHistory: OrderStatusEntry[];
  /** Internal notes for the store owner — never shown to the customer. */
  adminNotes?: string;
  subtotalMinor: number;
  deliveryTotalMinor: number;
  totalMinor: number;
  amountDueNowMinor: number;
  amountDueLaterMinor: number;
  /**
   * Test or live mode captured when payment was initialized. Legacy rows have
   * no value and are treated as live (DECISIONS 2026-10-29).
   */
  paymentMode?: "test" | "live";
  /** Gateway last used to initialize payment (paystack|bachs). */
  paymentGateway?: "paystack" | "bachs";
  /** Unique gateway reference for this order's last payment attempt. */
  paymentReference?: string;
  /** BACHS checkout session id for the last attempt (poll verification). */
  paymentCheckoutId?: string;
  /** paymentStatus: initiated | paid | failed | refunded. */
  paymentStatus?: string;
  /** Amount sent to the gateway, in `paymentCurrency` minor units. */
  paymentAmountMinor?: number;
  /**
   * Currency the gateway was actually charged in. Differs from `currency`
   * only when "Always pay in naira" converted a USD order at initialize.
   */
  paymentCurrency?: Currency;
  /** When the payment was verified as paid. */
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    sizeLabel: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    availability: { type: String, enum: ["in_stock", "pre_order"], required: true },
    preorderArrivalDate: Date,
    paymentMode: { type: String, enum: ["full", "deposit"], default: "full" },
    depositPercent: Number,
    imageUrl: String,
    unitPriceMinor: { type: Number, required: true, min: 0 },
    lineTotalMinor: { type: Number, required: true, min: 0 },
    dueNowMinor: { type: Number, required: true, min: 0 },
    dueLaterMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderStatusEntrySchema = new Schema<OrderStatusEntry>(
  {
    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      required: true,
    },
    at: { type: Date, default: Date.now },
    note: String,
    by: String,
  },
  { _id: false },
);

const OrderShipmentSchema = new Schema<OrderShipment>(
  {
    kind: { type: String, enum: ["in_stock", "pre_order"], required: true },
    arrivalDate: Date,
    itemIndexes: { type: [Number], default: [] },
    deliveryFeeMinor: { type: Number, required: true, min: 0 },
    freeDelivery: { type: Boolean, default: false },
    minDays: { type: Number, required: true, min: 0 },
    maxDays: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderSchema = new Schema<OrderDoc>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, index: true },
    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending_payment",
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true },
      notes: String,
    },
    location: {
      locationId: String,
      country: { type: String, required: true },
      region: String,
      cityArea: { type: String, required: true },
      minDays: { type: Number, required: true },
      maxDays: { type: Number, required: true },
    },
    currency: { type: String, enum: ["USD", "NGN"], required: true },
    baseCurrency: { type: String, enum: ["USD", "NGN"], required: true },
    exchangeRate: { type: Number, required: true, min: 0 },
    items: { type: [OrderItemSchema], default: [] },
    shipments: { type: [OrderShipmentSchema], default: [] },
    statusHistory: { type: [OrderStatusEntrySchema], default: [] },
    adminNotes: String,
    subtotalMinor: { type: Number, required: true, min: 0 },
    deliveryTotalMinor: { type: Number, required: true, min: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
    amountDueNowMinor: { type: Number, required: true, min: 0 },
    amountDueLaterMinor: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: ["test", "live"] },
    paymentGateway: { type: String, enum: ["paystack", "bachs"] },
    paymentReference: { type: String, index: true },
    paymentCheckoutId: { type: String },
    paymentStatus: { type: String },
    paymentAmountMinor: { type: Number, min: 0 },
    paymentCurrency: { type: String, enum: ["USD", "NGN"] },
    paidAt: Date,
  },
  { timestamps: true },
);

export const OrderModel: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) ??
  mongoose.model<OrderDoc>("Order", OrderSchema);
