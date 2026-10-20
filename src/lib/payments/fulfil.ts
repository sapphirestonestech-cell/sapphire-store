import type { OrderDoc } from "@/lib/models/order";
import { ProductModel } from "@/lib/models/product";
import { sendOrderConfirmationEmail } from "@/lib/email";

/**
 * Convert a BACHS decimal-money string ("45200.00") to whole minor units.
 * Money comparisons must happen on integers, never on floats directly
 * (BACHS docs: "compare amounts as whole minor units").
 */
export function decimalStringToMinor(value: string): number {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

/**
 * Mark an order paid and run the once-only side effects: per-size stock
 * decrement and the confirmation email. Callers must have verified the
 * payment with the gateway first (webhook signature or a retrieve call) —
 * this helper never trusts a redirect and never talks to a gateway.
 */
export async function fulfilPaidOrder(
  order: OrderDoc,
  paidAt: Date = new Date(),
): Promise<void> {
  if (order.status === "paid") return;
  order.status = "paid";
  order.paymentStatus = "paid";
  order.paidAt = paidAt;
  order.statusHistory = [
    ...(order.statusHistory ?? []),
    {
      status: "paid",
      at: paidAt,
      note: order.paymentGateway
        ? `Payment verified with ${order.paymentGateway}`
        : "Payment verified",
    },
  ];
  await order.save();

  for (const item of order.items) {
    if (item.availability !== "in_stock") continue;
    try {
      // $gte guard so a racing checkout can never drive stock negative;
      // shortfalls stay for admin reconciliation instead of going below zero.
      await ProductModel.updateOne(
        {
          _id: item.productId,
          "sizes.sizeLabel": item.sizeLabel,
          "sizes.stockQuantity": { $gte: item.quantity },
        },
        { $inc: { "sizes.$.stockQuantity": -Math.max(0, item.quantity) } },
      );
    } catch {
      // Stock reconciliation is an admin concern; never block fulfilment.
    }
  }

  await sendOrderConfirmationEmail(order.customer.email, order).catch(() => {});
}
