import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { OrderModel, type OrderDoc } from "@/lib/models/order";
import { orderMoney, paymentChargeCurrency, paymentChargeMinor } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/currency";
import { fromMinor } from "@/lib/checkout";
import { PaymentStatusBadge, OrderStatusBadge } from "@/components/admin/order-status-badge";
import { VerifyPaymentButton } from "@/components/admin/verify-payment-button";
import { TestBadge } from "@/components/admin/test-badge";

export const metadata = { title: "Payment" };

function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  await connection();
  const { reference } = await params;

  let order: OrderDoc | null = null;
  let failed = false;
  try {
    await connectDb();
    const doc = await OrderModel.findOne({ paymentReference: reference }).lean();
    order = doc ? (doc as unknown as OrderDoc) : null;
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <div
        role="alert"
        className="rounded-md border border-danger/40 bg-card p-6 shadow-card"
      >
        <p className="text-body text-danger">
          We couldn&apos;t reach the database. Check MONGODB_URI in .env.local,
          then refresh.
        </p>
      </div>
    );
  }
  if (!order) notFound();

  const charge = formatPrice(
    fromMinor(paymentChargeMinor(order)),
    paymentChargeCurrency(order),
  );
  const pending = order.status === "pending_payment";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/payments" className="text-body text-accent-strong underline">
          All payments
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="break-all font-sans text-heading-lg">{reference}</h1>
          <TestBadge mode={order.paymentMode} />
          <PaymentStatusBadge status={order.paymentStatus} />
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-body text-muted">
          {order.paymentGateway
            ? `Paid through ${order.paymentGateway}`
            : "No gateway recorded"}{" "}
          · Order{" "}
          <Link
            href={`/admin/orders/${String(order._id)}`}
            className="text-accent-strong underline"
          >
            {order.orderNumber}
          </Link>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="mb-3 font-sans text-subheading">
              Payment
            </h2>
            <div className="rounded-md bg-card p-5 shadow-card">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-label text-muted">Amount sent</dt>
                  <dd className="text-body-lg font-semibold tabular">{charge}</dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Currency</dt>
                  <dd className="text-body">
                    {paymentChargeCurrency(order)}
                    {order.paymentCurrency && order.paymentCurrency !== order.currency
                      ? ` (converted from ${order.currency})`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Gateway</dt>
                  <dd className="text-body capitalize">
                    {order.paymentGateway ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Reference</dt>
                  <dd className="break-all text-body">{order.paymentReference}</dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Started</dt>
                  <dd className="text-body">{formatDateTime(order.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Paid at</dt>
                  <dd className="text-body">
                    {order.paidAt ? formatDateTime(order.paidAt) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-muted">BACHS checkout</dt>
                  <dd className="break-all text-body">
                    {order.paymentCheckoutId ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Exchange rate used</dt>
                  <dd className="text-body tabular">
                    1 USD = {order.exchangeRate.toLocaleString("en-US")} NGN
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section aria-labelledby="order-heading">
            <h2 id="order-heading" className="mb-3 font-sans text-subheading">
              Order summary
            </h2>
            <div className="rounded-md bg-card p-5 shadow-card">
              <p className="text-body">
                {order.customer.name} · {order.customer.email}
              </p>
              <p className="mt-1 text-body text-muted">
                {order.location.cityArea}
                {order.location.region ? `, ${order.location.region}` : ""},{" "}
                {order.location.country}
              </p>
              <dl className="mt-4 space-y-2 border-t border-border-subtle pt-4 text-body">
                <div className="flex justify-between">
                  <dt className="text-muted">Order total</dt>
                  <dd className="tabular">{orderMoney(order.totalMinor, order)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Due now</dt>
                  <dd className="font-semibold tabular">
                    {orderMoney(order.amountDueNowMinor, order)}
                  </dd>
                </div>
                {order.amountDueLaterMinor > 0 ? (
                  <div className="flex justify-between text-muted">
                    <dt>Due before shipping</dt>
                    <dd className="tabular">
                      {orderMoney(order.amountDueLaterMinor, order)}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <Link
                href={`/admin/orders/${String(order._id)}`}
                className="mt-4 inline-block text-body text-accent-strong underline"
              >
                Open the order
              </Link>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="verify-heading" className="rounded-md bg-card p-6 shadow-card">
            <h2 id="verify-heading" className="font-sans text-subheading">
              Reconcile
            </h2>
            <p className="mt-1 text-body text-muted">
              Ask the gateway for this payment&apos;s real status. The order is
              only marked paid when the amount and currency match.
            </p>
            <div className="mt-4">
              {pending ? (
                <VerifyPaymentButton reference={reference} />
              ) : (
                <p className="text-body text-muted">
                  This payment is already resolved.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-md bg-card p-6 shadow-card">
            <h2 className="font-sans text-subheading">Record</h2>
            <p className="mt-1 text-body text-muted">
              Payment data lives on the order. Gateway responses and webhook
              logs are not stored yet.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
