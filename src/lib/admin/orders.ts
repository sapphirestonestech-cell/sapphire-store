import type { sanitizeFilter } from "mongoose";
import { OrderModel, type OrderDoc, type OrderStatus } from "@/lib/models/order";
import { formatPrice, priceIn, type Currency } from "@/lib/currency";
import { fromMinor } from "@/lib/checkout";
import { chargeAmountForOrder } from "@/lib/payments";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { dataScopeFilter, type DataScope } from "@/lib/admin/data-scope";

/**
 * Admin order rules — ProductReq.md §6.7, §11.1.
 *
 * Payment verification is the only way an order becomes Paid (§10.5), so the
 * admin can move an order forward through fulfilment, cancel it before it
 * ships, or mark it refunded after a manual gateway refund. Nothing here
 * touches stock: cancellation/refund reconciliation is flagged for later
 * (OPEN_QUESTIONS.md).
 */

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: [],
  paid: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const CANCELLABLE: OrderStatus[] = ["pending_payment", "paid", "processing"];
const REFUNDABLE: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

export function allowedNextStatuses(status: OrderStatus): OrderStatus[] {
  return ALLOWED_NEXT[status] ?? [];
}

export function canCancelOrder(status: OrderStatus): boolean {
  return CANCELLABLE.includes(status);
}

export function canRefundOrder(status: OrderStatus): boolean {
  return REFUNDABLE.includes(status);
}

export class OrderAdminError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderAdminError";
    this.status = status;
  }
}

export type PaymentFilter = "unpaid" | "paid" | "failed" | "refunded";

/** Mongoose 9 no longer exports QueryFilter; recover it from a public API. */
export type OrderFilter = Parameters<typeof sanitizeFilter<OrderDoc>>[0];

export interface AdminOrderFilters {
  status?: OrderStatus;
  payment?: PaymentFilter;
  gateway?: "paystack" | "bachs";
  availability?: "in_stock" | "pre_order";
  location?: string;
  q?: string;
  from?: string;
  to?: string;
  /** Back-office data scope; not a URL filter (see lib/admin/data-scope). */
  scope?: DataScope;
}

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function first(v: string | string[] | undefined): string | undefined {
  const value = Array.isArray(v) ? v[0] : v;
  return value?.trim() || undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validDate(value?: string): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}

/** Parse the orders list query string, ignoring anything unrecognised. */
export function parseOrderFilters(
  sp: Record<string, string | string[] | undefined>,
): AdminOrderFilters {
  const status = first(sp.status);
  const payment = first(sp.payment);
  const gateway = first(sp.gateway);
  const availability = first(sp.availability);
  return {
    status: ORDER_STATUSES.includes(status as OrderStatus)
      ? (status as OrderStatus)
      : undefined,
    payment: ["unpaid", "paid", "failed", "refunded"].includes(payment ?? "")
      ? (payment as PaymentFilter)
      : undefined,
    gateway:
      gateway === "paystack" || gateway === "bachs" ? gateway : undefined,
    availability:
      availability === "in_stock" || availability === "pre_order"
        ? availability
        : undefined,
    location: first(sp.location),
    q: first(sp.q),
    from: validDate(first(sp.from)),
    to: validDate(first(sp.to)),
  };
}

/** Translate filters into a Mongo query, combining every condition safely. */
export function orderFilterQuery(
  filters: AdminOrderFilters,
): OrderFilter {
  const and: OrderFilter[] = [];

  if (filters.scope) and.push(dataScopeFilter(filters.scope));
  if (filters.status) and.push({ status: filters.status });

  if (filters.payment === "unpaid") {
    and.push({
      $or: [
        { paymentStatus: { $exists: false } },
        { paymentStatus: null },
        { paymentStatus: "initiated" },
      ],
    });
  } else if (filters.payment) {
    and.push({ paymentStatus: filters.payment });
  }

  if (filters.gateway) and.push({ paymentGateway: filters.gateway });
  if (filters.availability) {
    and.push({ "items.availability": filters.availability });
  }
  if (filters.location) {
    and.push({
      "location.cityArea": new RegExp(escapeRegex(filters.location), "i"),
    });
  }
  if (filters.q) {
    const re = new RegExp(escapeRegex(filters.q), "i");
    and.push({
      $or: [
        { orderNumber: re },
        { "customer.email": re },
        { "customer.name": re },
      ],
    });
  }

  const createdAt: Record<string, Date> = {};
  if (filters.from) createdAt.$gte = new Date(`${filters.from}T00:00:00.000`);
  if (filters.to) createdAt.$lte = new Date(`${filters.to}T23:59:59.999`);
  if (Object.keys(createdAt).length > 0) and.push({ createdAt });

  return and.length > 0 ? { $and: and } : {};
}

export async function queryAdminOrders(
  filters: AdminOrderFilters,
  limit = 100,
): Promise<OrderDoc[]> {
  const docs = await OrderModel.find(orderFilterQuery(filters))
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs as unknown as OrderDoc[];
}

export async function countAdminOrders(
  filters: AdminOrderFilters,
): Promise<number> {
  return OrderModel.countDocuments(orderFilterQuery(filters));
}

export async function getAdminOrder(id: string): Promise<OrderDoc | null> {
  if (!OBJECT_ID_RE.test(id)) return null;
  const doc = await OrderModel.findById(id).lean();
  return doc ? (doc as unknown as OrderDoc) : null;
}

function appendHistory(
  order: OrderDoc,
  status: OrderStatus,
  note?: string,
  by?: string,
) {
  order.statusHistory = [
    ...(order.statusHistory ?? []),
    { status, at: new Date(), ...(note ? { note } : {}), ...(by ? { by } : {}) },
  ];
}

export async function updateOrderStatus(
  id: string,
  next: OrderStatus,
  options: { note?: string; by?: string } = {},
): Promise<OrderDoc> {
  const order = await getAdminOrder(id);
  if (!order) throw new OrderAdminError("Order not found.", 404);
  if (order.status === next) return order;

  if (!allowedNextStatuses(order.status).includes(next)) {
    throw new OrderAdminError(
      `${ORDER_STATUS_LABELS[order.status]} cannot move to ${ORDER_STATUS_LABELS[next]}.`,
    );
  }

  order.status = next;
  appendHistory(order, next, options.note, options.by);
  await OrderModel.updateOne(
    { _id: order._id },
    {
      $set: {
        status: order.status,
        statusHistory: order.statusHistory,
      },
    },
  );
  return order;
}

export async function cancelOrder(
  id: string,
  options: { note?: string; by?: string } = {},
): Promise<OrderDoc> {
  const order = await getAdminOrder(id);
  if (!order) throw new OrderAdminError("Order not found.", 404);
  if (order.status === "cancelled") return order;
  if (!canCancelOrder(order.status)) {
    throw new OrderAdminError(
      "This order has already shipped and can no longer be cancelled.",
    );
  }
  order.status = "cancelled";
  appendHistory(order, "cancelled", options.note ?? "Cancelled by admin", options.by);
  await OrderModel.updateOne(
    { _id: order._id },
    { $set: { status: order.status, statusHistory: order.statusHistory } },
  );
  return order;
}

export async function refundOrder(
  id: string,
  options: { note?: string; by?: string } = {},
): Promise<OrderDoc> {
  const order = await getAdminOrder(id);
  if (!order) throw new OrderAdminError("Order not found.", 404);
  if (order.status === "refunded") return order;
  if (!canRefundOrder(order.status)) {
    throw new OrderAdminError("Only a paid order can be marked refunded.");
  }
  order.status = "refunded";
  order.paymentStatus = "refunded";
  appendHistory(
    order,
    "refunded",
    options.note ?? "Refunded manually through the gateway",
    options.by,
  );
  await OrderModel.updateOne(
    { _id: order._id },
    {
      $set: {
        status: order.status,
        paymentStatus: order.paymentStatus,
        statusHistory: order.statusHistory,
      },
    },
  );
  return order;
}

export async function setAdminNotes(
  id: string,
  notes: string,
): Promise<OrderDoc> {
  const order = await getAdminOrder(id);
  if (!order) throw new OrderAdminError("Order not found.", 404);
  const value = notes.slice(0, 2000);
  await OrderModel.updateOne({ _id: order._id }, { $set: { adminNotes: value } });
  order.adminNotes = value;
  return order;
}

/** Money in the currency the customer bought in (never mixes currencies). */
export function orderMoney(
  minor: number,
  order: Pick<OrderDoc, "baseCurrency" | "currency" | "exchangeRate">,
): string {
  const amount = priceIn(
    fromMinor(minor),
    order.baseCurrency,
    order.currency,
    order.exchangeRate,
  );
  return formatPrice(amount, order.currency);
}

/** The amount actually sent to the gateway, in charge-currency minor units. */
export function paymentChargeMinor(
  order: Pick<
    OrderDoc,
    | "paymentAmountMinor"
    | "paymentCurrency"
    | "amountDueNowMinor"
    | "totalMinor"
    | "baseCurrency"
    | "currency"
    | "exchangeRate"
  >,
): number {
  return (
    order.paymentAmountMinor ??
    chargeAmountForOrder(order, paymentChargeCurrency(order)).minor
  );
}

/**
 * The currency the gateway was actually charged in — naira for a converted USD
 * order under "Always pay in naira", otherwise the display currency. Money
 * sent to the gateway must be formatted with this, not `order.currency`.
 */
export function paymentChargeCurrency(
  order: Pick<OrderDoc, "paymentCurrency" | "currency">,
): Currency {
  return order.paymentCurrency ?? order.currency;
}

const CSV_COLUMNS = [
  "Order number",
  "Placed",
  "Customer",
  "Email",
  "Phone",
  "Delivery location",
  "Items",
  "Subtotal",
  "Delivery",
  "Total",
  "Due now",
  "Due later",
  "Currency",
  "Exchange rate",
  "Order status",
  "Payment status",
  "Gateway",
  "Reference",
];

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Full export of the filtered orders, newest first (§6.7). */
export function ordersToCsv(orders: OrderDoc[]): string {
  const rows = orders.map((order) =>
    [
      order.orderNumber,
      new Date(order.createdAt).toISOString(),
      order.customer.name,
      order.customer.email,
      order.customer.phone,
      [order.location.cityArea, order.location.region, order.location.country]
        .filter(Boolean)
        .join(", "),
      order.items
        .map((i) => `${i.name} (${i.sizeLabel}) x${i.quantity}`)
        .join("; "),
      fromMinor(order.subtotalMinor).toFixed(2),
      fromMinor(order.deliveryTotalMinor).toFixed(2),
      fromMinor(order.totalMinor).toFixed(2),
      fromMinor(order.amountDueNowMinor).toFixed(2),
      fromMinor(order.amountDueLaterMinor).toFixed(2),
      order.currency,
      order.exchangeRate,
      ORDER_STATUS_LABELS[order.status] ?? order.status,
      order.paymentStatus ?? "initiated",
      order.paymentGateway ?? "",
      order.paymentReference ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  return [CSV_COLUMNS.join(","), ...rows].join("\r\n");
}
