import type { OrderStatus } from "@/lib/models/order";

/**
 * Order status labels — shared by the confirmation page and the tracking
 * page so the same status never reads two different ways.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
