import { connectDb } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { getSettings } from "@/lib/settings";
import { convertAmount, formatPrice, roundAmount, type Currency } from "@/lib/currency";
import { fromMinor } from "@/lib/checkout";
import { dataScopeFilter, type DataScope } from "@/lib/admin/data-scope";
import type { OrderFilter } from "@/lib/admin/orders";

/**
 * Compact metric strips shown above the Orders and Payments tables. These are
 * deliberately small and cheap (counts + one sum) so the list pages stay fast;
 * the full analytics live on the dashboard (ProductReq.md §6.2).
 */

/** Keep two conditions independent even when both use `$or`. */
function scoped(base: OrderFilter, scope: DataScope): OrderFilter {
  return { $and: [base, dataScopeFilter(scope)] };
}

export interface Metric {
  label: string;
  value: string | number;
  href?: string;
  tone?: "warning" | "success";
}

/** Headline figures for the Orders list. */
export async function loadOrderMetrics(scope: DataScope): Promise<Metric[]> {
  await connectDb();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [total, pendingPayment, awaitingShipment, deliveredToday] =
    await Promise.all([
      OrderModel.countDocuments(scoped({}, scope)),
      OrderModel.countDocuments(scoped({ status: "pending_payment" }, scope)),
      OrderModel.countDocuments(
        scoped({ status: { $in: ["paid", "processing"] } }, scope),
      ),
      OrderModel.countDocuments(
        scoped(
          {
            status: "delivered",
            updatedAt: { $gte: startOfToday },
          },
          scope,
        ),
      ),
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
export async function loadPaymentMetrics(scope: DataScope): Promise<Metric[]> {
  await connectDb();
  const settings = await getSettings();

  const [paid, awaiting, needsReview, collected] = await Promise.all([
    OrderModel.countDocuments(scoped({ paymentStatus: "paid" }, scope)),
    OrderModel.countDocuments(
      scoped(
        {
          paymentReference: { $nin: [null, ""] },
          $or: [
            { paymentStatus: "initiated" },
            { paymentStatus: { $exists: false } },
            { paymentStatus: null },
          ],
        },
        scope,
      ),
    ),
    OrderModel.countDocuments(
      scoped({ paymentStatus: { $in: ["failed", "mismatch"] } }, scope),
    ),
    OrderModel.find(
      scoped(
        {
          paymentStatus: "paid",
          status: { $nin: ["cancelled", "refunded"] },
        },
        scope,
      ),
    )
      .select("paymentAmountMinor paymentCurrency amountDueNowMinor baseCurrency currency exchangeRate")
      .lean(),
  ]);

  let collectedTotal = 0;
  for (const order of collected as unknown as {
    paymentAmountMinor?: number;
    paymentCurrency?: Currency;
    amountDueNowMinor: number;
    baseCurrency?: Currency;
    currency: Currency;
    exchangeRate: number;
  }[]) {
    // `paymentAmountMinor` is in `paymentCurrency` (naira after a conversion),
    // not `currency`, so every figure must be read in the same currency before
    // converting to the reporting base — otherwise a USD order charged in
    // naira would be double-converted. Rows with no charge yet fall back to
    // the base-currency "due now" amount.
    const charged = order.paymentAmountMinor != null;
    const sourceCurrency = charged
      ? order.paymentCurrency ?? order.currency
      : order.baseCurrency ?? order.currency;
    const minor = charged ? order.paymentAmountMinor! : order.amountDueNowMinor;
    collectedTotal += convertAmount(
      fromMinor(minor),
      order.exchangeRate,
      sourceCurrency,
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
