import Link from "next/link";
import { connection } from "next/server";
import {
  CHART_RANGES,
  loadDashboard,
  parseChartRange,
  type ChartRange,
  type DashboardData,
} from "@/lib/admin/dashboard";
import { formatPrice } from "@/lib/currency";
import { orderMoney } from "@/lib/admin/orders";
import type { OrderDoc } from "@/lib/models/order";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/order-status-badge";
import {
  DonutChart,
  HorizontalBars,
  RankedBars,
  TrendChart,
} from "@/components/admin/charts";
import {
  ORDER_STATUSES,
  statusLabel,
  statusTone,
} from "@/lib/order-status";

export const metadata = { title: "Dashboard" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Token fills for the charts. Gold leads; other series stay in warm neutrals. */
const TOKEN = {
  gold: "#C9A24B",
  deepGold: "#8A6A1F",
  ink: "#211D19",
  taupe: "#7A7168",
  sand: "#D9D2C6",
  success: "#3F7A57",
  error: "#B3402F",
  warning: "#A8741A",
};

/**
 * A single dashboard figure. Per DESIGN.md §9: white 28px card, one figure at
 * 600 weight, small label beneath. No accent dots and no hint text — the count
 * and its name are enough.
 */
function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-heading font-semibold tabular text-primary">
        {value}
      </p>
      <p className="mt-1 text-body text-muted">{label}</p>
    </>
  );
  const className =
    "block rounded-md bg-card p-6 shadow-card transition-shadow hover:shadow-float";
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-md bg-card p-6 shadow-card ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h2 className="text-body font-medium text-primary">{title}</h2>
          {subtitle ? (
            <p className="text-body text-muted">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SalesTrend({ data }: { data: DashboardData }) {
  const { chart, baseCurrency } = data;
  const rangeLabel =
    chart.range === "30d"
      ? "the last 30 days"
      : chart.range === "12w"
        ? "the last 12 weeks"
        : "the last 12 months";

  return (
    <Panel
      title="Sales trend"
      subtitle={`${formatPrice(chart.total, baseCurrency)} · ${rangeLabel}`}
      className="lg:col-span-2"
      action={
        <div className="flex gap-1" role="group" aria-label="Sales period">
          {CHART_RANGES.map((range) => {
            const active = range.value === chart.range;
            return (
              <Link
                key={range.value}
                href={`/admin?range=${range.value}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-9 items-center rounded-pill px-3 text-label ${
                  active
                    ? "bg-accent-wash text-primary"
                    : "text-muted hover:text-primary"
                }`}
              >
                {range.label}
              </Link>
            );
          })}
        </div>
      }
    >
      <TrendChart
        points={chart.points}
        currency={baseCurrency}
        total={chart.total}
        rangeLabel={rangeLabel}
      />
      <div className="mt-2 flex justify-between pl-16 text-label text-muted">
        <span>{chart.points[0]?.label ?? ""}</span>
        <span>{chart.points[chart.points.length - 1]?.label ?? ""}</span>
      </div>
    </Panel>
  );
}

function RecentOrders({ orders }: { orders: OrderDoc[] }) {
  return (
    <Panel
      title="Recent orders"
      subtitle="The eight most recent checkouts."
      action={
        <Link href="/admin/orders" className="text-body text-accent-strong underline">
          All orders
        </Link>
      }
    >
      {orders.length === 0 ? (
        <p className="mt-4 text-body text-muted">
          No orders yet. They appear here the moment checkout starts.
        </p>
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto rounded-sm md:block">
            <table className="w-full min-w-[640px] text-left text-body">
              <thead>
                <tr className="border-b border-border-subtle text-label text-muted">
                  <th scope="col" className="px-3 py-3 font-medium">Order</th>
                  <th scope="col" className="px-3 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-3 py-3 font-medium">Total</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="px-3 py-3 font-medium">Payment</th>
                  <th scope="col" className="px-3 py-3 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={String(order._id)}
                    className="border-b border-border-subtle last:border-b-0"
                  >
                    <td className="px-3 py-4">
                      <Link
                        href={`/admin/orders/${String(order._id)}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-4">{order.customer.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 font-semibold tabular">
                      {orderMoney(order.totalMinor, order)}
                    </td>
                    <td className="px-3 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-4">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-muted">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3 md:hidden">
            {orders.map((order) => (
              <li key={String(order._id)} className="rounded-sm bg-app p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/orders/${String(order._id)}`}
                      className="text-body font-medium underline-offset-2 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-label text-muted">
                      {order.customer.name}
                    </p>
                  </div>
                  <p className="shrink-0 text-body font-semibold tabular">
                    {orderMoney(order.totalMinor, order)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();
  const sp = await searchParams;
  const rawRange = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  const range: ChartRange = parseChartRange(rawRange);

  let data: DashboardData | null = null;
  try {
    data = await loadDashboard(range);
  } catch {
    data = null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-heading-lg">Dashboard</h1>
          <p className="mt-1 text-body text-muted">
            Your store at a glance.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center rounded-pill bg-accent px-5 text-body font-medium text-primary shadow-gold-glow"
        >
          Add product
        </Link>
      </div>

      {!data ? (
        <div
          role="alert"
          className="rounded-md border border-danger/40 bg-card p-6 shadow-card"
        >
          <p className="text-body text-danger">
            We couldn&apos;t reach the database. Check MONGODB_URI in
            .env.local, then refresh.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <div className="flex flex-col gap-6 rounded-md bg-card p-6 shadow-card sm:flex-row sm:items-end sm:justify-between sm:p-8">
              <div>
                <p className="text-subheading text-muted">Total sales</p>
                <p className="mt-2 text-display font-semibold tabular text-primary">
                  {formatPrice(data.sales.usd, "USD")}
                </p>
              </div>
              <p className="text-body text-muted tabular">
                {formatPrice(data.sales.ngn, "NGN")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
              <StatCard
                label="Orders today"
                value={data.ordersToday}
                href="/admin/orders"
              />
              <StatCard
                label="Pending payment"
                value={data.pendingPayment}
                href="/admin/orders?status=pending_payment"
              />
              <StatCard
                label="Awaiting shipment"
                value={data.awaitingShipment}
                href="/admin/orders?status=paid"
              />
              <StatCard
                label="Pre-orders waiting"
                value={data.preordersAwaitingArrival}
                href="/admin/orders?availability=pre_order"
              />
              <StatCard
                label="Low stock"
                value={data.lowStock}
                href="/admin/products"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SalesTrend data={data} />

            <Panel title="Average order">
              <p className="mt-4 text-heading-lg font-semibold tabular text-primary">
                {formatPrice(data.averageOrderValue, data.baseCurrency)}
              </p>
              <p className="mt-1 text-body text-muted">
                Across {data.paidOrderCount}{" "}
                {data.paidOrderCount === 1 ? "paid order" : "paid orders"}
              </p>
              <dl className="mt-5 space-y-3 border-t border-border-subtle pt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-body text-muted">In stock</dt>
                  <dd className="text-body font-semibold text-primary tabular">
                    {formatPrice(
                      data.revenueByAvailability[0]?.value ?? 0,
                      data.baseCurrency,
                    )}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-body text-muted">Pre-order</dt>
                  <dd className="text-body font-semibold text-primary tabular">
                    {formatPrice(
                      data.revenueByAvailability[1]?.value ?? 0,
                      data.baseCurrency,
                    )}
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            <DonutChart
              title="Revenue by availability"
              slices={data.revenueByAvailability.map((entry, index) => ({
                label: entry.label,
                value: entry.value,
                color: index === 0 ? TOKEN.gold : TOKEN.deepGold,
              }))}
              currency={data.baseCurrency}
              total={data.chart.total}
              emptyLabel="No confirmed sales in this period yet."
            />

            <DonutChart
              title="Revenue by category"
              slices={data.revenueByCategory.map((entry, index) => ({
                label: entry.name,
                value: entry.revenue,
                color:
                  [TOKEN.gold, TOKEN.deepGold, TOKEN.warning, TOKEN.taupe, TOKEN.sand, TOKEN.ink][
                    index % 6
                  ],
              }))}
              currency={data.baseCurrency}
              total={data.chart.total}
              emptyLabel="No categorised sales in this period yet."
            />

            <Panel
              title="Best-selling rings"
              className="2xl:col-span-1"
            >
              <RankedBars
                rows={data.topProducts.map((product) => ({
                  label: product.name,
                  value: product.revenue,
                  meta: `${product.units} sold · ${product.share}% of sales`,
                  href: `/admin/products`,
                }))}
                currency={data.baseCurrency}
              />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel title="Orders by status" className="lg:col-span-1">
              <HorizontalBars
                rows={ORDER_STATUSES.filter((status) =>
                  data.ordersByStatus.some((row) => row.status === status),
                ).map((status) => ({
                  label: statusLabel(status),
                  value:
                    data.ordersByStatus.find((row) => row.status === status)
                      ?.count ?? 0,
                  color:
                    statusTone(status) === "warning"
                      ? TOKEN.warning
                      : statusTone(status) === "error"
                        ? TOKEN.error
                        : statusTone(status) === "success"
                          ? TOKEN.success
                          : TOKEN.gold,
                  href: `/admin/orders?status=${status}`,
                }))}
              />
            </Panel>

            <div className="lg:col-span-2">
              <RecentOrders orders={data.recentOrders} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
