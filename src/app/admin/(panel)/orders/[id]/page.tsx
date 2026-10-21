import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import {
  allowedNextStatuses,
  canCancelOrder,
  canRefundOrder,
  getAdminOrder,
  orderMoney,
  paymentChargeCurrency,
  paymentChargeMinor,
} from "@/lib/admin/orders";
import { formatPrice } from "@/lib/currency";
import { fromMinor } from "@/lib/checkout";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderDoc } from "@/lib/models/order";
import { RingPlaceholder } from "@/components/ui/ring-placeholder";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/order-status-badge";
import { OrderActions } from "@/components/admin/order-actions";

export const metadata = { title: "Order" };

function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2 id={id} className="mb-3 font-sans text-subheading">
      {children}
    </h2>
  );
}

function gatewayMoney(order: OrderDoc): string {
  return formatPrice(
    fromMinor(paymentChargeMinor(order)),
    paymentChargeCurrency(order),
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  let order: OrderDoc | null = null;
  let failed = false;
  try {
    await connectDb();
    order = await getAdminOrder(id);
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <div role="alert" className="rounded-md border border-danger/40 bg-card p-6 shadow-card">
        <p className="text-body text-danger">
          We couldn&apos;t reach the database. Check MONGODB_URI in .env.local,
          then refresh.
        </p>
      </div>
    );
  }
  if (!order) notFound();

  const history = [...(order.statusHistory ?? [])].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  const nextStatuses = allowedNextStatuses(order.status);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-body text-accent-strong underline">
          All orders
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-sans text-heading-lg">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <p className="mt-1 text-body text-muted">
          Placed {formatDateTime(order.createdAt)} · {order.currency}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section aria-labelledby="customer-heading">
            <SectionHeading id="customer-heading">Customer</SectionHeading>
            <div className="rounded-md bg-card p-5 shadow-card">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-body-lg font-medium">{order.customer.name}</p>
                  <p className="text-body text-muted">
                    <a href={`mailto:${order.customer.email}`} className="underline">
                      {order.customer.email}
                    </a>
                  </p>
                  <p className="text-body text-muted">{order.customer.phone}</p>
                </div>
                <div>
                  <p className="text-label text-muted">Delivery location</p>
                  <p className="text-body">
                    {order.location.cityArea}
                    {order.location.region ? `, ${order.location.region}` : ""},{" "}
                    {order.location.country}
                  </p>
                  <p className="mt-1 text-label text-muted">
                    {order.location.minDays}–{order.location.maxDays} days
                  </p>
                </div>
              </div>
              {order.customer.notes ? (
                <div className="mt-4 border-t border-border-subtle pt-4">
                  <p className="text-label text-muted">Customer note</p>
                  <p className="mt-1 text-body">{order.customer.notes}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="items-heading">
            <SectionHeading id="items-heading">Rings</SectionHeading>
            <ul className="divide-y divide-border-subtle rounded-md bg-card px-5 shadow-card">
              {order.items.map((item, index) => {
                const hasImage =
                  item.imageUrl != null && !item.imageUrl.startsWith("placeholder:");
                return (
                  <li key={index} className="flex gap-4 py-4">
                    <div className="size-16 shrink-0 overflow-hidden rounded-sm">
                      {hasImage ? (
                        // eslint-disable-next-line @next/next/no-img-element -- CDN URLs
                        <img
                          src={item.imageUrl as string}
                          alt={item.name}
                          width={64}
                          height={80}
                          className="size-full object-cover"
                        />
                      ) : (
                        <RingPlaceholder label={item.name} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-lg font-medium">{item.name}</p>
                      <p className="text-body text-muted">
                        Size {item.sizeLabel} ·{" "}
                        {item.availability === "pre_order" ? "Pre-order" : "In stock"} · ×
                        {item.quantity}
                      </p>
                      {item.preorderArrivalDate ? (
                        <p className="text-label text-accent-strong">
                          Arriving {formatDate(item.preorderArrivalDate)}
                        </p>
                      ) : null}
                      {item.paymentMode === "deposit" && item.depositPercent ? (
                        <p className="text-label text-muted">
                          {item.depositPercent}% deposit ·{" "}
                          {orderMoney(item.dueNowMinor, order)} now,{" "}
                          {orderMoney(item.dueLaterMinor, order)} before shipping
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-body font-semibold tabular">
                        {orderMoney(item.lineTotalMinor, order)}
                      </p>
                      <p className="text-label text-muted tabular">
                        {orderMoney(item.unitPriceMinor, order)} each
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="shipments-heading">
            <SectionHeading id="shipments-heading">Shipments</SectionHeading>
            <ul className="space-y-3">
              {order.shipments.map((shipment, index) => (
                <li
                  key={`${shipment.kind}-${index}`}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-md bg-card p-5 shadow-card"
                >
                  <div>
                    <p className="text-body-lg font-medium">
                      {shipment.kind === "in_stock" ? "Ready to ship" : "Pre-order"}
                    </p>
                    <p className="text-body text-muted">
                      {shipment.kind === "pre_order" && shipment.arrivalDate
                        ? `Ships after ${formatDate(shipment.arrivalDate)} · `
                        : ""}
                      {shipment.minDays}–{shipment.maxDays} days
                    </p>
                  </div>
                  <p className="text-body font-semibold tabular">
                    {shipment.freeDelivery
                      ? "Free"
                      : orderMoney(shipment.deliveryFeeMinor, order)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="payment-heading">
            <SectionHeading id="payment-heading">Payment</SectionHeading>
            <div className="rounded-md bg-card p-5 shadow-card">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-label text-muted">Gateway</dt>
                  <dd className="text-body capitalize">
                    {order.paymentGateway ?? "Not started"}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Reference</dt>
                  <dd className="break-all text-body">
                    {order.paymentReference ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Amount sent</dt>
                  <dd className="text-body font-semibold tabular">
                    {gatewayMoney(order)}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Payment status</dt>
                  <dd className="mt-1">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Exchange rate used</dt>
                  <dd className="text-body tabular">
                    1 USD = {order.exchangeRate.toLocaleString("en-US")} NGN
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Paid at</dt>
                  <dd className="text-body">
                    {order.paidAt ? formatDateTime(order.paidAt) : "—"}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-border-subtle pt-4 text-label text-muted">
                Prices, fees and the exchange rate are frozen on the order.
                Refunds are made in the gateway dashboard, then marked here.
              </p>
            </div>
          </section>

          <section aria-labelledby="totals-heading">
            <SectionHeading id="totals-heading">Totals</SectionHeading>
            <dl className="space-y-2 rounded-md bg-card p-5 text-body shadow-card">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular">{orderMoney(order.subtotalMinor, order)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="tabular">
                  {order.deliveryTotalMinor === 0
                    ? "Free"
                    : orderMoney(order.deliveryTotalMinor, order)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border-subtle pt-2 text-body-lg">
                <dt className="font-medium">Total</dt>
                <dd className="font-semibold tabular">
                  {orderMoney(order.totalMinor, order)}
                </dd>
              </div>
              {order.amountDueLaterMinor > 0 ? (
                <>
                  <div className="flex justify-between pt-1 text-accent-strong">
                    <dt>Due now</dt>
                    <dd className="font-semibold tabular">
                      {orderMoney(order.amountDueNowMinor, order)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-muted">
                    <dt>Due before shipping</dt>
                    <dd className="tabular">
                      {orderMoney(order.amountDueLaterMinor, order)}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="timeline-heading">
            <SectionHeading id="timeline-heading">Timeline</SectionHeading>
            <ol className="rounded-md bg-card p-5 shadow-card">
              <li className="relative border-l border-border-subtle pb-5 pl-5 last:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-1.5 top-1 size-3 rounded-pill bg-accent"
                />
                <p className="text-body font-medium">Order placed</p>
                <p className="text-label text-muted">
                  {formatDateTime(order.createdAt)}
                </p>
              </li>
              {history.map((entry, index) => (
                <li
                  key={`${entry.status}-${index}`}
                  className="relative border-l border-border-subtle pb-5 pl-5 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-1.5 top-1 size-3 rounded-pill bg-accent"
                  />
                  <p className="text-body font-medium">
                    {ORDER_STATUS_LABELS[entry.status] ?? entry.status}
                  </p>
                  <p className="text-label text-muted">
                    {formatDateTime(entry.at)}
                    {entry.by ? ` · ${entry.by}` : ""}
                  </p>
                  {entry.note ? (
                    <p className="mt-1 text-body text-muted">{entry.note}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-8">
            <OrderActions
              orderId={String(order._id)}
              status={order.status}
              nextStatuses={nextStatuses}
              canCancel={canCancelOrder(order.status)}
              canRefund={canRefundOrder(order.status)}
              canVerify={
                order.status === "pending_payment" &&
                Boolean(order.paymentReference)
              }
              paymentReference={order.paymentReference}
              adminNotes={order.adminNotes ?? ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
