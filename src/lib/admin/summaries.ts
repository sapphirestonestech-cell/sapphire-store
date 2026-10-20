import { connectDb } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { getSettings } from "@/lib/settings";
import { convertAmount, formatPrice, roundAmount, type Currency } from "@/lib/currency";
import { fromMinor } from "@/lib/checkout";

/**
 * Compact metric strips shown above the Orders and Payments tables. These are
 * deliberately small and cheap (counts + one sum) so the list pages stay fast;
 * the full analytics live on the dashboard (ProductReq.md §6.2).
 */

export interface Metric {
  label: string;
  value: string | number;
  href?: string;
  tone?: "warning" | "success";
}

/** Headline figures for the Orders list. */
export async function loadOrderMetrics(): Promise<Metric[]> {
  await connectDb();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [total, pendingPayment, awaitingShipment, deliveredToday] =
    await Promise.all([
      OrderModel.countDocuments(),
      OrderModel.countDocuments({ status: "pending_payment" }),
      OrderModel.countDocuments({ status: { $in: ["paid", "processing"] } }),
      OrderModel.countDocuments({
        status: "delivered",
        updatedAt: { $gte: startOfToday },
      }),
    ]);

  return [
    { label: "All orders", value: total, href: "/admin/orders" },
    {
      label: "Pending payment",
      value: pendingPayment,
      href: "/admin/orders?status=pending_payment",
      tone: pendingPayment > 0 ? "warning" : undefined,
    },
    {
      label: "Awaiting shipment",
      value: awaitingShipment,
      href: "/admin/orders?status=paid",
    },
    {
      label: "Delivered today",
      value: deliveredToday,
      href: "/admin/orders?status=delivered",
      tone: deliveredToday > 0 ? "success" : undefined,
    },
  ];
}

/** Headline figures for the Payments list. */
export async function loadPaymentMetrics(): Promise<Metric[]> {
  await connectDb();
  const settings = await getSettings();

  const [paid, awaiting, needsReview, collected] = await Promise.all([
    OrderModel.countDocuments({ paymentStatus: "paid" }),
    OrderModel.countDocuments({
      paymentReference: { $nin: [null, ""] },
      $or: [
        { paymentStatus: "initiated" },
        { paymentStatus: { $exists: false } },
        { paymentStatus: null },
      ],
    }),
    OrderModel.countDocuments({
      paymentStatus: { $in: ["failed", "mismatch"] },
    }),
    OrderModel.find({
      paymentStatus: "paid",
      status: { $nin: ["cancelled", "refunded"] },
    })
      .select("paymentAmountMinor amountDueNowMinor baseCurrency currency exchangeRate")
      .lean(),
  ]);

  let collectedTotal = 0;
  for (const order of collected as unknown as {
    paymentAmountMinor?: number;
    amountDueNowMinor: number;
    baseCurrency?: Currency;
    currency: Currency;
    exchangeRate: number;
  }[]) {
    collectedTotal += convertAmount(
      fromMinor(order.paymentAmountMinor ?? order.amountDueNowMinor),
      order.exchangeRate,
      order.baseCurrency ?? order.currency,
      settings.baseCurrency,
    );
  }

  return [
    {
      label: "Paid",
      value: paid,
      href: "/admin/payments?payment=paid",
      tone: "success",
    },
    {
      label: "Awaiting payment",
      value: awaiting,
      href: "/admin/payments?payment=unpaid",
      tone: awaiting > 0 ? "warning" : undefined,
    },
    {
      label: "Needs review",
      value: needsReview,
      href: "/admin/payments?payment=failed",
      tone: needsReview > 0 ? "warning" : undefined,
    },
    {
      label: "Collected",
      value: formatPrice(
        roundAmount(collectedTotal, settings.baseCurrency, settings.rounding),
        settings.baseCurrency,
      ),
    },
  ];
}
