"use client";

import Link from "next/link";
import { Price } from "@/components/price";
import { RingPlaceholder } from "@/components/ui/ring-placeholder";
import { useCart } from "@/components/cart-provider";
import {
  HARD_LINE_CAP,
  MAX_QUANTITY_PER_LINE,
  clearCart,
  removeItem,
  setQuantity,
  type CartItem,
} from "@/lib/cart";
import { formatArrivalLong } from "@/lib/format";
import { SaveForLaterButton } from "@/components/storefront/save-for-later-button";

const PLACEHOLDER_PREFIX = "placeholder:";

function Stepper({ item }: { item: CartItem }) {
  // In-stock lines stop at the default cap in the cart (the product panel
  // and the server both enforce the real stock limit); pre-order lines may
  // reach the admin's larger per-order maximum.
  const max =
    item.availability === "pre_order" ? HARD_LINE_CAP : MAX_QUANTITY_PER_LINE;
  const atMax = item.quantity >= max;
  return (
    <div className="inline-flex items-center rounded-pill border border-border-subtle">
      <button
        type="button"
        onClick={() => setQuantity(item.productId, item.sizeLabel, item.quantity - 1)}
        aria-label={`Decrease quantity of ${item.name}`}
        className="flex size-10 items-center justify-center rounded-pill text-primary hover:bg-accent-wash"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M6 10h8" />
        </svg>
      </button>
      <span
        aria-live="polite"
        className="min-w-8 text-center text-body font-medium tabular"
      >
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={() => setQuantity(item.productId, item.sizeLabel, item.quantity + 1)}
        disabled={atMax}
        aria-label={`Increase quantity of ${item.name}`}
        className="flex size-10 items-center justify-center rounded-pill text-primary hover:bg-accent-wash disabled:text-border-default"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M10 6v8M6 10h8" />
        </svg>
      </button>
    </div>
  );
}

function LineItem({ item }: { item: CartItem }) {
  const hasImage =
    item.imageUrl != null && !item.imageUrl.startsWith(PLACEHOLDER_PREFIX);
  const lineTotal = item.unitPriceBase * item.quantity;

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/product/${item.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-sm"
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary CDN
          <img
            src={item.imageUrl as string}
            alt={item.name}
            width={96}
            height={120}
            className="size-full object-cover"
          />
        ) : (
          <RingPlaceholder label={item.name} />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/product/${item.slug}`}
            className="text-body-lg font-medium text-primary hover:text-accent-strong"
          >
            {item.name}
          </Link>
          <p className="text-body text-muted">
            Size {item.sizeLabel} ·{" "}
            {item.availability === "pre_order" ? "Pre-order" : "In stock"}
          </p>
          {item.availability === "pre_order" && item.preorderArrivalDate ? (
            <p className="text-body text-accent-strong">
              Arriving {formatArrivalLong(item.preorderArrivalDate)}
            </p>
          ) : null}
          {item.paymentMode === "deposit" && item.depositPercent > 0 ? (
            <p className="text-body text-muted">
              {item.depositPercent}% deposit due at checkout
            </p>
          ) : null}
          <div className="pt-1">
            <Stepper item={item} />
          </div>
        </div>

        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          <p className="text-body-lg font-semibold">
            <Price amount={lineTotal} />
          </p>
          <button
            type="button"
            onClick={() => removeItem(item.productId, item.sizeLabel)}
            className="text-body text-muted hover:text-primary hover:underline"
          >
            Remove
          </button>
          <SaveForLaterButton
            productId={item.productId}
            sizeLabel={item.sizeLabel}
          />
        </div>
      </div>
    </li>
  );
}

export function CartView() {
  const { items, subtotalBase } = useCart();

  if (items.length === 0) {
    return (
      <div className="page-width py-16">
        <div className="mx-auto max-w-md rounded-md bg-card p-8 text-center shadow-card">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-accent-wash">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-7 text-accent-strong"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 6h12l-1 10H5L4 6z" strokeLinejoin="round" />
              <path d="M7.5 6a2.5 2.5 0 015 0" />
            </svg>
          </div>
          <h1 className="font-sans text-heading-lg text-primary">
            Your cart is empty
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-body text-muted">
            Add a ring and it will wait for you here.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow"
          >
            Browse rings
          </Link>
        </div>
      </div>
    );
  }

  const anyPreorder = items.some((i) => i.availability === "pre_order");

  return (
    <div className="page-width py-8 md:py-12">
      <h1 className="font-sans text-heading-lg text-primary">Your cart</h1>
      <p className="mt-1 text-body text-muted">
        {items.length} {items.length === 1 ? "ring" : "rings"} ready to go
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-12">
        <ul className="divide-y divide-border-subtle rounded-md bg-card px-5 shadow-card">
          {items.map((item) => (
            <LineItem
              key={`${item.productId}:${item.sizeLabel}`}
              item={item}
            />
          ))}
        </ul>

        <aside className="space-y-4 rounded-md bg-card p-6 shadow-card lg:sticky lg:top-28">
          <h2 className="font-sans text-subheading text-primary">Summary</h2>
          <div className="flex items-center justify-between text-body-lg">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold">
              <Price amount={subtotalBase} />
            </span>
          </div>
          <p className="text-body text-muted">
            Delivery is calculated at checkout from your location
            {anyPreorder ? ", with in-stock and pre-order rings shipped separately" : ""}.
          </p>
          <Link
            href="/checkout"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow"
          >
            Go to checkout
          </Link>
          <div className="flex items-center justify-between pt-1">
            <Link
              href="/shop"
              className="text-body font-medium text-accent-strong hover:underline"
            >
              Keep shopping
            </Link>
            <button
              type="button"
              onClick={clearCart}
              className="text-body text-muted hover:text-primary"
            >
              Clear cart
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
