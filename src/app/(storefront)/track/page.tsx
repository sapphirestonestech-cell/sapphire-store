import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getOrderByNumber } from "@/lib/orders";
import { formatPrice, priceIn } from "@/lib/currency";
import { fromMinor } from "@/lib/checkout";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderDoc, OrderStatus } from "@/lib/models/order";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = {
  title: "Track your order",
  robots: { index: false },
};

const CARD = "rounded-md bg-card p-5 shadow-card";

/**
 * Track order — ProductReq.md §5.7 (public order lookup by number).
 * The form submits as a plain GET so tracking works without JavaScript;
 * `searchParams` is read inside a Suspense boundary so the shell can still
 * be prerendered under cacheComponents (same pattern as /search).
 */
export default function TrackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="page-width py-8 md:py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <h1 className="font-sans text-heading-lg text-primary">
            Track your order
          </h1>
          <p className="text-body-lg text-muted">
            Enter your order number from your confirmation email — it starts
            with SAP-.
          </p>
        </header>
        <Suspense fallback={<TrackSkeleton />}>
          <TrackLookup searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

function TrackSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 rounded-md bg-border-default" />
      <div className="h-40 rounded-md bg-border-default" />
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

function prettyDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function TrackLookup({ searchParams }: { searchParams: SearchParams }) {
  const resolved = await searchParams;
  const raw = resolved.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  let order: OrderDoc | null = null;
  if (q) {
    await connection();
    order = await getOrderByNumber(q.toUpperCase());
  }

  return (
    <div className="space-y-6">
      <form
        action="/track"
        method="GET"
        className={`flex flex-col gap-3 sm:flex-row sm:items-center ${CARD}`}
      >
        <label htmlFor="order-number" className="sr-only">
          Order number
        </label>
        <input
          id="order-number"
          name="q"
          defaultValue={q}
          placeholder="e.g. SAP-20261018-9B7C2D"
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full rounded-pill border border-border-subtle bg-card px-5 text-body-lg text-primary placeholder:text-muted"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow"
        >
          Track order
        </button>
      </form>

      {q && !order ? <NotFound /> : null}
      {order ? <TrackResult order={order} /> : null}
    </div>
  );
}

function NotFound() {
  return (
    <div role="status" className={`space-y-2 ${CARD}`}>
      <p className="text-body-lg font-medium text-primary">
        We couldn&apos;t find an order with that number.
      </p>
      <p className="text-body text-muted">
        Check the order number in your confirmation email — it looks like
        SAP-20261018-9B7C2D — and try again.
      </p>
      <p className="text-body text-muted">
        Still stuck?{" "}
        <Link
          href="/contact"
          className="text-primary underline underline-offset-4 hover:text-accent-strong"
        >
          Contact us
        </Link>{" "}
        and keep the number handy.
      </p>
    </div>
  );
}

const TIMELINE_STEPS = [
  "Order placed",
  "Payment confirmed",
  "Preparing your ring",
  "Shipped",
  "Delivered",
] as const;

function currentStep(status: OrderStatus): number {
  switch (status) {
    case "pending_payment":
      return 1;
    case "paid":
    case "processing":
      return 2;
    case "shipped":
      return 3;
    case "delivered":
      return 4;
    default:
      return -1;
  }
}

function stepNote(status: OrderStatus, step: number): string | null {
  if (step === 1 && status === "pending_payment") {
    return "Online payment is being connected — nothing is charged yet.";
  }
  if (step === 2 && status === "paid") {
    return "Payment received — preparing your ring is the next step.";
  }
  if (step === 2 && status === "processing") {
    return "Your ring is being prepared for shipping.";
  }
  return null;
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3"
      fill="currentColor"
    >
      <path d="M8 0l1.8 6.2L16 8l-6.2 1.8L8 16l-1.8-6.2L0 8l6.2-1.8L8 0z" />
    </svg>
  );
}

function Timeline({ order }: { order: OrderDoc }) {
  const delivered = order.status === "delivered";
  const cur = currentStep(order.status);

  return (
    <section aria-labelledby="timeline-heading" className={`${CARD} p-6`}>
      <h2
        id="timeline-heading"
        className="font-sans text-subheading text-primary"
      >
        Where your order is
      </h2>
      <ol className="mt-5">
        {TIMELINE_STEPS.map((label, i) => {
          const isDone = delivered || i < cur;
          const isCurrent = !delivered && i === cur;
          const isLast = i === TIMELINE_STEPS.length - 1;
          const lineGold = delivered || i + 1 < cur;
          const note = isCurrent ? stepNote(order.status, i) : null;
          return (
            <li
              key={label}
              aria-current={isCurrent ? "step" : undefined}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-[-2px] left-[11px] top-[26px] w-0.5 ${
                    lineGold ? "bg-accent" : "bg-border-subtle"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                  isDone
                    ? "bg-accent text-primary"
                    : isCurrent
                      ? "border-2 border-accent-strong bg-card text-accent-strong"
                      : "border border-border-subtle bg-border-default"
                }`}
              >
                {isDone ? <CheckIcon /> : isCurrent ? <SparkleIcon /> : null}
              </span>
              <div className="-mt-0.5 min-w-0">
                <p
                  className={`text-body-lg ${
                    isDone || isCurrent
                      ? "font-medium text-primary"
                      : "text-muted"
                  }`}
                >
                  {label}
                </p>
                {note ? (
                  <p className="mt-0.5 text-body text-muted">{note}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Summary({ order }: { order: OrderDoc }) {
  const location = order.location;
  return (
    <section aria-labelledby="summary-heading" className={CARD}>
      <h2
        id="summary-heading"
        className="font-sans text-subheading text-primary"
      >
        Order summary
      </h2>
      <ul className="mt-3 space-y-3">
        {order.items.map((item, idx) => (
          <li key={idx} className="text-body">
            <Link
              href={`/product/${item.slug}`}
              className="font-medium text-primary hover:text-accent-strong"
            >
              {item.name}
            </Link>
            <p className="text-muted">
              Size {item.sizeLabel} ·{" "}
              {item.availability === "pre_order" ? "Pre-order" : "In stock"}
              {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
              {item.preorderArrivalDate
                ? ` · Arriving ${prettyDate(item.preorderArrivalDate)}`
                : ""}
            </p>
          </li>
        ))}
      </ul>

      <ul className="mt-4 space-y-2 border-t border-border-subtle pt-4">
        {order.shipments.map((s) => (
          <li key={s.kind} className="flex justify-between gap-4 text-body">
            <span className="text-muted">
              {s.kind === "in_stock" ? "In-stock rings" : "Pre-order rings"}
            </span>
            <span className="text-right">
              {s.kind === "pre_order" && s.arrivalDate
                ? `Ships after ${prettyDate(s.arrivalDate)}, `
                : ""}
              {s.minDays}–{s.maxDays} days
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-border-subtle pt-4 text-body">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Total</dt>
          <dd className="font-semibold">{money(order.totalMinor, order)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Destination</dt>
          <dd className="text-right">
            {location.cityArea}
            {location.region ? `, ${location.region}` : ""},{" "}
            {location.country}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/order/${order.orderNumber}`}
          className="inline-flex min-h-12 items-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow"
        >
          View full order details
        </Link>
        <Link
          href="/contact"
          className="inline-flex min-h-12 items-center rounded-pill border border-border-subtle bg-card px-6 text-body-lg text-primary hover:bg-accent-wash"
        >
          Need help?
        </Link>
      </div>
    </section>
  );
}

function CancelledNotice({ order }: { order: OrderDoc }) {
  return (
    <div className={`space-y-3 ${CARD}`}>
      <p className="text-body-lg font-medium text-primary">
        This order was cancelled
      </p>
      <p className="text-body text-muted">
        Order {order.orderNumber}, placed {prettyDate(order.createdAt)}. Keep
        the number handy and{" "}
        <Link
          href="/contact"
          className="text-primary underline underline-offset-4 hover:text-accent-strong"
        >
          reach out
        </Link>{" "}
        — we&apos;ll take care of the rest.
      </p>
      <Link
        href="/shop"
        className="inline-flex min-h-12 items-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow"
      >
        Continue shopping
      </Link>
    </div>
  );
}

function TrackResult({ order }: { order: OrderDoc }) {
  const cancelled = order.status === "cancelled";
  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${CARD}`}>
        <div>
          <span
            className={`inline-flex items-center rounded-sm px-3 py-1 text-label font-medium ${
              cancelled
                ? "bg-border-default text-muted"
                : "bg-accent-wash text-accent-strong"
            }`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <p className="mt-2 text-body text-muted">
            Order {order.orderNumber} · placed {prettyDate(order.createdAt)}
          </p>
        </div>
        {!cancelled ? (
          <p className="text-body text-muted">
            {order.location.minDays}–{order.location.maxDays} day delivery
          </p>
        ) : null}
      </div>

      {cancelled ? (
        <CancelledNotice order={order} />
      ) : (
        <>
          <Timeline order={order} />
          <Summary order={order} />
        </>
      )}
    </div>
  );
}
