import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import {
  countAdminOrders,
  orderMoney,
  parseOrderFilters,
  queryAdminOrders,
  ORDER_STATUSES,
  type AdminOrderFilters,
} from "@/lib/admin/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderDoc } from "@/lib/models/order";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/order-status-badge";
import { MetricStrip } from "@/components/admin/metric-strip";
import { loadOrderMetrics, type Metric } from "@/lib/admin/summaries";

export const metadata = { title: "Orders" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function itemCount(order: OrderDoc): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function exportHref(filters: AdminOrderFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  const query = params.toString();
  return `/api/admin/orders/export${query ? `?${query}` : ""}`;
}

export default function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersSlot searchParams={searchParams} />
    </Suspense>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-40 animate-pulse rounded-pill bg-border-default" />
      <div className="h-36 animate-pulse rounded-md bg-border-default" />
      <div className="h-64 animate-pulse rounded-sm bg-border-default" />
    </div>
  );
}

async function OrdersSlot({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = parseOrderFilters(sp);

  await connection();

  let orders: OrderDoc[] = [];
  let total = 0;
  let failed = false;
  let metrics: Metric[] = [];
  try {
    await connectDb();
    [orders, total, metrics] = await Promise.all([
      queryAdminOrders(filters),
      countAdminOrders(filters),
      loadOrderMetrics(),
    ]);
  } catch {
    failed = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-heading-lg">Orders</h1>
          <p className="mt-1 text-body text-muted">
            {failed
              ? "Orders couldn’t be loaded."
              : `${total} ${total === 1 ? "order" : "orders"}${
                  total > orders.length ? ` · showing latest ${orders.length}` : ""
                }`}
          </p>
        </div>
        <Link
          href={exportHref(filters)}
          className="inline-flex min-h-11 items-center rounded-pill border border-border-subtle bg-card px-5 text-body font-medium"
        >
          Export CSV
        </Link>
      </div>

      {!failed && metrics.length > 0 ? <MetricStrip metrics={metrics} /> : null}

      <form
        method="get"
        action="/admin/orders"
        className="rounded-md bg-card p-5 shadow-card"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-label text-muted">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Order number, name or email"
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-label text-muted">Order status</span>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-label text-muted">Payment</span>
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
            <span className="text-label text-muted">Availability</span>
            <select
              name="availability"
              defaultValue={filters.availability ?? ""}
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            >
              <option value="">Any</option>
              <option value="in_stock">In stock</option>
              <option value="pre_order">Pre-order</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-label text-muted">Location</span>
            <input
              type="text"
              name="location"
              defaultValue={filters.location ?? ""}
              placeholder="City or area"
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-label text-muted">From</span>
            <input
              type="date"
              name="from"
              defaultValue={filters.from ?? ""}
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-label text-muted">To</span>
            <input
              type="date"
              name="to"
              defaultValue={filters.to ?? ""}
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-pill bg-accent px-5 text-body font-medium text-primary shadow-gold-glow"
          >
            Apply filters
          </button>
          <Link href="/admin/orders" className="text-body text-accent-strong underline">
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

      {!failed && orders.length === 0 ? (
        <div className="rounded-md bg-card p-10 text-center shadow-card">
          <p className="text-subheading">No orders match these filters</p>
          <p className="mx-auto mt-2 max-w-md text-body text-muted">
            Clear the filters to see every order.
          </p>
          <Link
            href="/admin/orders"
            className="mt-5 inline-flex min-h-11 items-center rounded-pill border border-border-subtle px-5 text-body font-medium"
          >
            Clear filters
          </Link>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-sm bg-card shadow-card md:block">
            <table className="w-full min-w-[760px] text-left text-body">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border-subtle text-label text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Order</th>
                  <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-5 py-3 font-medium">Items</th>
                  <th scope="col" className="px-5 py-3 font-medium">Total</th>
                  <th scope="col" className="px-5 py-3 font-medium">Payment</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={String(order._id)}
                    className="border-b border-border-subtle last:border-b-0"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${String(order._id)}`}
                        className="font-medium hover:text-accent-strong"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-label text-muted">
                        {formatDate(order.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{order.customer.name}</p>
                      <p className="text-label text-muted">
                        {order.customer.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 tabular">{itemCount(order)}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold tabular">
                      {orderMoney(order.totalMinor, order)}
                    </td>
                    <td className="px-5 py-4">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/orders/${String(order._id)}`}
                        className="text-body text-accent-strong underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {orders.map((order) => (
              <li
                key={String(order._id)}
                className="rounded-md bg-card p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/orders/${String(order._id)}`}
                      className="text-body-lg font-medium hover:text-accent-strong"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-label text-muted">
                      {formatDate(order.createdAt)} · {order.customer.name}
                    </p>
                  </div>
                  <p className="shrink-0 text-body-lg font-semibold tabular">
                    {orderMoney(order.totalMinor, order)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
                <Link
                  href={`/admin/orders/${String(order._id)}`}
                  className="mt-3 inline-block text-body text-accent-strong underline"
                >
                  View order
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
