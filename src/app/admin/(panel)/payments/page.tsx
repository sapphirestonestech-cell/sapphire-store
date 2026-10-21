import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { OrderModel, type OrderDoc } from "@/lib/models/order";
import {
  orderFilterQuery,
  parseOrderFilters,
  paymentChargeCurrency,
  paymentChargeMinor,
  type OrderFilter,
} from "@/lib/admin/orders";
import { formatPrice } from "@/lib/currency";
import { fromMinor } from "@/lib/checkout";
import { PaymentStatusBadge } from "@/components/admin/order-status-badge";
import { MetricStrip } from "@/components/admin/metric-strip";
import { loadPaymentMetrics, type Metric } from "@/lib/admin/summaries";

export const metadata = { title: "Payments" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function amount(order: OrderDoc): string {
  return formatPrice(
    fromMinor(paymentChargeMinor(order)),
    paymentChargeCurrency(order),
  );
}

export default function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<PaymentsSkeleton />}>
      <PaymentsSlot searchParams={searchParams} />
    </Suspense>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-40 animate-pulse rounded-pill bg-border-default" />
      <div className="h-32 animate-pulse rounded-md bg-border-default" />
      <div className="h-64 animate-pulse rounded-sm bg-border-default" />
    </div>
  );
}

async function PaymentsSlot({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = parseOrderFilters(sp);

  await connection();

  let payments: OrderDoc[] = [];
  let total = 0;
  let failed = false;
  let metrics: Metric[] = [];

  if (filters.status || filters.availability || filters.location) {
    // These filters apply to orders, not payments; ignore them here.
    filters.status = undefined;
    filters.availability = undefined;
    filters.location = undefined;
  }

  const query = {
    $and: [
      orderFilterQuery(filters),
      { paymentReference: { $nin: [null, ""] } },
    ],
  } as OrderFilter;

  try {
    await connectDb();
    let loadedMetrics: Metric[] = [];
    [[payments, total], loadedMetrics] = await Promise.all([
      Promise.all([
        OrderModel.find(query).sort({ createdAt: -1 }).limit(100).lean(),
        OrderModel.countDocuments(query),
      ]),
      loadPaymentMetrics(),
    ]);
    payments = payments as unknown as OrderDoc[];
    metrics = loadedMetrics;
  } catch {
    failed = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-heading-lg">Payments</h1>
        <p className="mt-1 text-body text-muted">
          {failed
            ? "Payments couldn’t be loaded."
            : `${total} ${total === 1 ? "payment" : "payments"}${
                total > payments.length ? ` · showing latest ${payments.length}` : ""
              }`}
        </p>
      </div>

      {!failed && metrics.length > 0 ? <MetricStrip metrics={metrics} /> : null}

      <form
        method="get"
        action="/admin/payments"
        className="rounded-md bg-card p-5 shadow-card"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-label text-muted">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Reference, order, name or email"
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-label text-muted">Gateway</span>
            <select
              name="gateway"
              defaultValue={filters.gateway ?? ""}
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            >
              <option value="">All gateways</option>
              <option value="paystack">Paystack</option>
              <option value="bachs">BACHS</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-label text-muted">Payment status</span>
            <select
              name="payment"
              defaultValue={filters.payment ?? ""}
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            >
              <option value="">All payments</option>
              <option value="unpaid">Awaiting payment</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1.5">
              <span className="text-label text-muted">From</span>
              <input
                type="date"
                name="from"
                defaultValue={filters.from ?? ""}
                className="h-11 w-full rounded-pill border border-border-subtle bg-card px-3 text-body"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-label text-muted">To</span>
              <input
                type="date"
                name="to"
                defaultValue={filters.to ?? ""}
                className="h-11 w-full rounded-pill border border-border-subtle bg-card px-3 text-body"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-pill bg-accent px-5 text-body font-medium text-primary shadow-gold-glow"
          >
            Apply filters
          </button>
          <Link href="/admin/payments" className="text-body text-accent-strong underline">
            Clear filters
          </Link>
        </div>
      </form>

      {failed ? (
        <div
          role="alert"
          className="rounded-md border border-danger/40 bg-card p-6 shadow-card"
        >
          <p className="text-body text-danger">
            We couldn&apos;t reach the database. Check MONGODB_URI in
            .env.local, then refresh.
          </p>
        </div>
      ) : null}

      {!failed && payments.length === 0 ? (
        <div className="rounded-md bg-card p-10 text-center shadow-card">
          <p className="text-subheading">No payments yet</p>
          <p className="mx-auto mt-2 max-w-md text-body text-muted">
            A payment appears here once a customer starts checkout with a
            gateway.
          </p>
        </div>
      ) : null}

      {payments.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-sm bg-card shadow-card md:block">
            <table className="w-full min-w-[720px] text-left text-body">
              <thead>
                <tr className="border-b border-border-subtle text-label text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Reference</th>
                  <th scope="col" className="px-5 py-3 font-medium">Order</th>
                  <th scope="col" className="px-5 py-3 font-medium">Gateway</th>
                  <th scope="col" className="px-5 py-3 font-medium">Amount</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Date</th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((order) => {
                  const reference = paymentReference(order);
                  return (
                    <tr
                      key={String(order._id)}
                      className="border-b border-border-subtle last:border-b-0"
                    >
                      <td className="break-all px-5 py-4">
                        <Link
                          href={`/admin/payments/${encodeURIComponent(reference)}`}
                          className="font-medium hover:text-accent-strong"
                        >
                          {reference}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${String(order._id)}`}
                          className="underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-4 capitalize">
                        {order.paymentGateway ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold tabular">
                        {amount(order)}
                      </td>
                      <td className="px-5 py-4">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-5 py-4">
                        {formatDate(order.paidAt ?? order.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/payments/${encodeURIComponent(reference)}`}
                          className="text-accent-strong underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {payments.map((order) => {
              const reference = paymentReference(order);
              return (
                <li
                  key={String(order._id)}
                  className="rounded-md bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/payments/${encodeURIComponent(reference)}`}
                        className="break-all text-body font-medium hover:text-accent-strong"
                      >
                        {reference}
                      </Link>
                      <p className="text-label text-muted">
                        {order.orderNumber} · {order.paymentGateway ?? "—"}
                      </p>
                    </div>
                    <p className="shrink-0 text-body-lg font-semibold tabular">
                      {amount(order)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <span className="text-label text-muted">
                      {formatDate(order.paidAt ?? order.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function paymentReference(order: OrderDoc): string {
  return order.paymentReference ?? "";
}
