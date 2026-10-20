import type { OrderStatus } from "@/lib/models/order";

/**
 * Order status labels — shared by the confirmation page, the tracking page
 * and the admin so the same status never reads two different ways.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export type StatusTone = "success" | "warning" | "error" | "neutral";

const ORDER_TONE: Record<OrderStatus, StatusTone> = {
  pending_payment: "warning",
  paid: "success",
  processing: "neutral",
  shipped: "neutral",
  delivered: "success",
  cancelled: "neutral",
  refunded: "neutral",
};

export function orderStatusTone(status: OrderStatus): StatusTone {
  return ORDER_TONE[status] ?? "neutral";
}

/** Every order status, in lifecycle order — drives dashboard breakdowns. */
export const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export function statusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

export function statusTone(status: OrderStatus): StatusTone {
  return orderStatusTone(status);
}

/**
 * Payment records live on the order. `initiated` is written when checkout
 * hands off to a gateway; older rows may have no value at all.
 */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  initiated: "Awaiting payment",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  mismatch: "Needs review",
};

export function paymentStatusLabel(status?: string | null): string {
  if (!status) return PAYMENT_STATUS_LABELS.initiated;
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function paymentStatusTone(status?: string | null): StatusTone {
  if (!status || status === "initiated") return "warning";
  if (status === "paid") return "success";
  if (status === "failed" || status === "mismatch") return "error";
  return "neutral";
}
