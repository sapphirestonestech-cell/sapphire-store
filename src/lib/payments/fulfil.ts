import type { OrderDoc } from "@/lib/models/order";
import { ProductModel } from "@/lib/models/product";
import { listAdminNotificationEmails } from "@/lib/admin/notifications";
import {
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
} from "@/lib/email";

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
  const isTest = order.paymentMode === "test";
  order.status = "paid";
  order.paymentStatus = "paid";
  order.paidAt = paidAt;
  order.statusHistory = [
    ...(order.statusHistory ?? []),
    {
      status: "paid",
      at: paidAt,
      note: order.paymentGateway
        ? `${isTest ? "Test payment" : "Payment"} verified with ${order.paymentGateway}`
        : isTest
          ? "Test payment verified"
          : "Payment verified",
    },
  ];
  await order.save();

  // Test-mode payments exist to exercise the flow, not to sell rings: never
  // touch stock and, by default, never email (DECISIONS 2026-10-29).
  //
  // `EMAIL_TEST_PAYMENTS=true` is a temporary diagnostic switch: it lets a
  // test payment send the real customer/admin emails so the message content
  // can be verified without taking money. Stock is still never touched. Leave
  // it unset in normal operation.
  const emailTestPayments = process.env.EMAIL_TEST_PAYMENTS === "true";
  if (isTest && !emailTestPayments) return;

  if (!isTest) {
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
  }

  await sendOrderConfirmationEmail(order.customer.email, order).catch(() => {});

  const admins = await listAdminNotificationEmails();
  if (admins.length > 0) {
    await sendAdminNewOrderEmail(admins, {
      id: String(order._id),
      orderNumber: order.orderNumber,
      customer: order.customer,
      currency: order.currency,
      baseCurrency: order.baseCurrency,
      exchangeRate: order.exchangeRate,
      items: order.items,
      location: order.location,
      subtotalMinor: order.subtotalMinor,
      totalMinor: order.totalMinor,
      amountDueNowMinor: order.amountDueNowMinor,
      amountDueLaterMinor: order.amountDueLaterMinor,
      deliveryTotalMinor: order.deliveryTotalMinor,
      paymentAmountMinor: order.paymentAmountMinor,
      paymentCurrency: order.paymentCurrency,
      paymentGateway: order.paymentGateway,
      paymentReference: order.paymentReference,
      shipments: order.shipments,
      createdAt: order.createdAt,
    }).catch(() => {});
  }
}
