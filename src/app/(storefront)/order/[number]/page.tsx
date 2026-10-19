import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { RingPlaceholder } from "@/components/ui/ring-placeholder";
import { PayNowCard } from "@/components/storefront/pay-now-card";
import { getOrderByNumber } from "@/lib/orders";
import { formatPrice, priceIn } from "@/lib/currency";
import { fromMinor } from "@/lib/checkout";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderDoc } from "@/lib/models/order";

export const metadata = {
  title: "Order confirmation",
  robots: { index: false },
};

interface PageProps {
  params: Promise<{ number: string }>;
}

export default function OrderPage({ params }: PageProps) {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

function OrderSkeleton() {
  return (
    <div className="page-width animate-pulse py-12">
      <div className="h-10 w-1/2 rounded-pill bg-pale-sand" />
      <div className="mt-8 h-64 w-full rounded-card bg-pale-sand" />
    </div>
  );
}

function money(minor: number, order: OrderDoc): string {
  const base = fromMinor(minor);
  const amount = priceIn(
    base,
    order.baseCurrency,
    order.currency,
    order.exchangeRate,
  );
  return formatPrice(amount, order.currency);
}

async function OrderDetail({ params }: PageProps) {
  const { number } = await params;
  await connection();
  const order = await getOrderByNumber(number);
  if (!order) notFound();

  const pending = order.status === "pending_payment";
  const location = order.location;

  return (
    <div className="page-width py-8 md:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <span className="inline-flex items-center rounded-chip-label bg-gold-wash px-3 py-1 text-label font-medium text-deep-gold">
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
          <h1 className="font-display text-heading-lg text-warm-ink">
            Thank you — your order is saved
          </h1>
          <p className="text-body text-soft-taupe">
            Order <span className="font-medium text-warm-ink">{order.orderNumber}</span>
            {" · "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </header>

        {pending ? (
          <PayNowCard orderNumber={order.orderNumber} defaultGateway={order.paymentGateway ?? null} />
        ) : null}

        {/* Items */}
        <section aria-labelledby="order-items-heading">
          <h2
            id="order-items-heading"
            className="mb-3 font-display text-subheading text-warm-ink"
          >
            Your rings
          </h2>
          <ul className="divide-y divide-hairline rounded-card bg-pure-white px-5 shadow-card">
            {order.items.map((item, idx) => {
              const hasImage =
                item.imageUrl != null && !item.imageUrl.startsWith("placeholder:");
              return (
                <li key={idx} className="flex gap-4 py-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-image">
                    {hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Cloudinary CDN
                      <img
                        src={item.imageUrl as string}
                        alt={item.name}
                        width={80}
                        height={100}
                        className="size-full object-cover"
                      />
                    ) : (
                      <RingPlaceholder label={item.name} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${item.slug}`}
                      className="text-body-lg font-medium text-warm-ink hover:text-deep-gold"
                    >
                      {item.name}
                    </Link>
                    <p className="text-body text-soft-taupe">
                      Size {item.sizeLabel} ·{" "}
                      {item.availability === "pre_order" ? "Pre-order" : "In stock"}
                      {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
                    </p>
                    {item.preorderArrivalDate ? (
                      <p className="text-body text-deep-gold">
                        Arriving{" "}
                        {new Date(item.preorderArrivalDate).toLocaleDateString(
                          "en-US",
                          { month: "long", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    ) : null}
                    {item.paymentMode === "deposit" && item.depositPercent ? (
                      <p className="text-body text-soft-taupe">
                        {item.depositPercent}% deposit · {money(item.dueNowMinor, order)}{" "}
                        now, {money(item.dueLaterMinor, order)} before shipping
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-body-lg font-semibold">
                    {money(item.lineTotalMinor, order)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Delivery */}
        <section aria-labelledby="order-delivery-heading">
          <h2
            id="order-delivery-heading"
            className="mb-3 font-display text-subheading text-warm-ink"
          >
            Delivery
          </h2>
          <div className="space-y-4 rounded-card bg-pure-white p-5 shadow-card">
            <p className="text-body text-warm-ink">
              <span className="font-medium">To:</span> {location.cityArea}
              {location.region ? `, ${location.region}` : ""}, {location.country}
            </p>
            <ul className="space-y-3">
              {order.shipments.map((s) => (
                <li
                  key={s.kind}
                  className="flex items-start justify-between gap-4 border-t border-hairline pt-3 first:border-t-0 first:pt-0"
                >
                  <div>
                    <p className="text-body font-medium">
                      {s.kind === "in_stock" ? "In-stock rings" : "Pre-order rings"}
                    </p>
                    <p className="text-body text-soft-taupe">
                      {s.kind === "pre_order" && s.arrivalDate
                        ? `Ships after ${new Date(s.arrivalDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}, `
                        : ""}
                      {s.minDays}–{s.maxDays} days
                    </p>
                  </div>
                  <p className="text-body font-medium">
                    {s.freeDelivery ? "Free" : money(s.deliveryFeeMinor, order)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-hairline pt-4 text-body">
              <div className="flex justify-between">
                <dt className="text-soft-taupe">Subtotal</dt>
                <dd>{money(order.subtotalMinor, order)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-soft-taupe">Delivery</dt>
                <dd>
                  {order.deliveryTotalMinor === 0
                    ? "Free"
                    : money(order.deliveryTotalMinor, order)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 text-body-lg">
                <dt className="font-medium">Total</dt>
                <dd className="font-semibold">{money(order.totalMinor, order)}</dd>
              </div>
              {order.amountDueLaterMinor > 0 ? (
                <>
                  <div className="flex justify-between pt-1 text-deep-gold">
                    <dt>Due now</dt>
                    <dd className="font-semibold">
                      {money(order.amountDueNowMinor, order)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-soft-taupe">
                    <dt>Due before shipping</dt>
                    <dd>{money(order.amountDueLaterMinor, order)}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </div>
        </section>

        {/* Delivery to + contact */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-card bg-pure-white p-5 shadow-card">
            <h2 className="font-display text-subheading text-warm-ink">Ships to</h2>
            <p className="mt-2 text-body text-warm-ink">{order.customer.name}</p>
            <p className="text-body text-soft-taupe">{order.customer.phone}</p>
            <p className="text-body text-soft-taupe">{order.customer.email}</p>
            <p className="mt-2 text-body text-soft-taupe">
              {location.cityArea}
              {location.region ? `, ${location.region}` : ""}, {location.country}
            </p>
          </div>
          <div className="rounded-card bg-pure-white p-5 shadow-card">
            <h2 className="font-display text-subheading text-warm-ink">Need help?</h2>
            <p className="mt-2 text-body text-soft-taupe">
              Keep your order number handy and reach out — we&apos;ll take care of
              the rest.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
