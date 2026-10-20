"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addItem, HARD_LINE_CAP, MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { useCart } from "@/components/cart-provider";
import { formatArrivalLong } from "@/lib/format";
import { priceIn, formatPrice } from "@/lib/currency";
import { useCurrency } from "@/components/currency-provider";
import { Toast } from "@/components/ui/toast";

export interface PurchasePanelProps {
  productId: string;
  slug: string;
  name: string;
  basePrice: number;
  availability: "in_stock" | "pre_order";
  preorderArrivalDate: string | null;
  paymentMode: "full" | "deposit";
  depositPercent: number | null;
  freeDelivery: { allLocations: boolean; locationIds: string[] };
  sizes: { sizeLabel: string; stockQuantity: number }[];
  imageUrl: string | null;
  /** Admin-set per-order cap for pre-order rings (ProductReq §"optional max pre-order quantity"). */
  preorderMaxQty?: number | null;
  /* Human-readable labels for the locations this ring ships free to. */
  freeDeliveryLabels?: string[];
}

/**
 * Purchase panel — DESIGN.md §7.13/§7.5. Size (native dropdown) and the
 * quantity stepper share one row, with "Add to cart" (primary) and "Proceed to
 * checkout" (secondary, §7.5 one-primary-per-view) side by side beneath them,
 * so a shopper can buy without leaving the product page. The primary label is
 * "Add to cart" for both in-stock and pre-order rings (client decision,
 * 2026-10-19); availability is communicated by the badge and arrival line.
 * Quantity is limited by the selected size's stock for in-stock rings and by
 * the admin's per-order maximum for pre-orders (ProductReq §cart rules).
 * No payment happens here; checkout carries the cart forward.
 */
export function PurchasePanel(props: PurchasePanelProps) {
  const router = useRouter();
  const { currency, usdToNgn, baseCurrency } = useCurrency();
  const { items } = useCart();
  const isPreorder = props.availability === "pre_order";
  const soldOut =
    !isPreorder &&
    props.sizes.length > 0 &&
    props.sizes.every((s) => s.stockQuantity === 0);

  const hasSizes = props.sizes.length > 0;

  const [selected, setSelected] = useState<string | null>(
    hasSizes && props.sizes.length === 1 ? props.sizes[0].sizeLabel : null,
  );
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    kind: "success" | "error";
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Success toasts auto-dismiss after a few seconds (§7.19); errors stay
  // until dismissed or cleared by the next size/quantity interaction.
  function showToast(message: string, kind: "success" | "error") {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToast({ message, kind });
    if (kind === "success") {
      toastTimer.current = setTimeout(() => {
        setToast(null);
        setFlash(null);
        toastTimer.current = null;
      }, 3200);
    }
  }

  function clearToast() {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToast(null);
  }

  const selectedSize =
    hasSizes && selected
      ? (props.sizes.find((s) => s.sizeLabel === selected) ?? null)
      : null;

  // The cart line label addItem() stores for this selection.
  const cartSize = hasSizes ? selected : "One size";
  const inCart = cartSize
    ? (items.find(
        (i) => i.productId === props.productId && i.sizeLabel === cartSize,
      )?.quantity ?? 0)
    : 0;

  const needsSize = hasSizes && !selected;

  // Line cap: in-stock rings are limited by the selected size's stock,
  // pre-orders by the admin's per-order maximum (default line cap).
  const lineCap = !hasSizes
    ? MAX_QUANTITY_PER_LINE
    : isPreorder
      ? (props.preorderMaxQty ?? MAX_QUANTITY_PER_LINE)
      : selectedSize
        ? selectedSize.stockQuantity
        : MAX_QUANTITY_PER_LINE;
  const cap = Math.max(1, lineCap);
  const remaining = Math.max(0, cap - inCart);
  const stepperMax = Math.max(1, Math.min(HARD_LINE_CAP, remaining));
  const atLimit = remaining <= 0;
  // Clamp to the live maximum while rendering so shrinking stock, adding to
  // cart or switching size never shows an out-of-range quantity.
  const effectiveQty = Math.min(qty, stepperMax);

  /** Adds the current selection to the cart. Returns false when it did not (no size yet, or already at the cap). */
  function addLine(): boolean {
    if (needsSize || soldOut || atLimit) return false;
    const addQty = Math.max(1, effectiveQty);
    addItem({
      productId: props.productId,
      slug: props.slug,
      name: props.name,
      sizeLabel: cartSize ?? "One size",
      quantity: addQty,
      unitPriceBase: props.basePrice,
      availability: props.availability,
      preorderArrivalDate: props.preorderArrivalDate,
      paymentMode: props.paymentMode,
      depositPercent: props.depositPercent ?? 0,
      freeDelivery: props.freeDelivery,
      imageUrl: props.imageUrl,
    });
    const message =
      addQty > 1
        ? `${addQty} × ${props.name} added to your cart.`
        : `${props.name} added to your cart.`;
    setFlash(message);
    showToast(message, "success");
    return true;
  }

  function add() {
    if (needsSize) {
      setFlash("Choose a size first.");
      showToast("Choose a size first.", "error");
      return;
    }
    addLine();
  }

  // Add the selection, then go straight to checkout (client decision,
  // 2026-10-19). When the line is already at its cap the cart holds it
  // already, so nothing is added and we only navigate.
  function proceed() {
    if (needsSize) {
      setFlash("Choose a size first.");
      showToast("Choose a size first.", "error");
      return;
    }
    addLine();
    router.push("/checkout");
  }

  const deposit =
    isPreorder && props.paymentMode === "deposit" && props.depositPercent
      ? props.depositPercent
      : null;
  const depositAmount = deposit
    ? priceIn(
        (props.basePrice * deposit) / 100,
        baseCurrency,
        currency,
        usdToNgn,
      )
    : null;

  const status = flash
    ? flash
    : atLimit
      ? isPreorder
        ? `Per-order maximum of ${cap} reached.`
        : hasSizes
          ? `All ${cap} in stock are already in your cart.`
          : "Maximum quantity reached."
      : inCart > 0
        ? `${inCart} in your cart`
        : "";

  return (
    <div className="space-y-4">
      {/* Size and quantity sit beside each other as equal halves (client
          instruction, 2026-10-19). Size is a native dropdown (DESIGN.md §7.13
          amended) so the control stays one compact line instead of a wrapping
          chip row. Stacks to one column on phones, where two halves are too
          narrow for the labels. */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {hasSizes ? (
          <div className="min-w-0 space-y-2">
            <label htmlFor="size-select" className="block text-body font-medium">
              Size
            </label>
            <div className="relative">
              <select
                id="size-select"
                value={selected ?? ""}
                onChange={(e) => {
                  setSelected(e.target.value || null);
                  setFlash(null);
                  clearToast();
                }}
                className="h-12 w-full appearance-none rounded-pill border border-border-subtle bg-card pl-5 pr-11 text-body font-medium text-primary transition-colors duration-fast hover:bg-accent-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="" disabled>
                  Choose a size
                </option>
                {props.sizes.map((s) => {
                  // Only in-stock sizes are governed by stockQuantity; pre-order
                  // sizes stay selectable (their cap is preorderMaxQty).
                  const unavailable = !isPreorder && s.stockQuantity === 0;
                  return (
                    <option
                      key={s.sizeLabel}
                      value={s.sizeLabel}
                      disabled={unavailable}
                    >
                      {unavailable
                        ? `${s.sizeLabel} (unavailable)`
                        : s.sizeLabel}
                    </option>
                  );
                })}
              </select>
              {/* Chevron — the native arrow is hidden above so the control
                  keeps the design system's pill shape. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8l4 4 4-4" />
              </svg>
            </div>
          </div>
        ) : null}

        {/* Quantity stepper — DESIGN.md §7.14. Fills its half of the row
            (client, 2026-10-19): buttons at the ends, count centred. */}
        <div className="min-w-0 space-y-2">
          <p id="qty-label" className="text-body font-medium">
            Quantity
          </p>
          <div
            role="group"
            aria-labelledby="qty-label"
            className="flex h-12 w-full items-center justify-between rounded-pill border border-border-subtle bg-card px-1"
          >
            <button
              type="button"
              onClick={() => {
                setQty((q) => Math.max(1, Math.min(stepperMax, q - 1)));
                setFlash(null);
                clearToast();
              }}
              disabled={effectiveQty <= 1}
              aria-label="Decrease quantity"
              className="flex size-11 items-center justify-center rounded-pill text-primary transition-colors hover:bg-accent-wash disabled:text-border-default"
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
              {effectiveQty}
            </span>
            <button
              type="button"
              onClick={() => {
                setQty((q) => Math.min(stepperMax, q + 1));
                setFlash(null);
                clearToast();
              }}
              disabled={effectiveQty >= stepperMax}
              aria-label="Increase quantity"
              className="flex size-11 items-center justify-center rounded-pill text-primary transition-colors hover:bg-accent-wash disabled:text-border-default"
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
        </div>
      </div>

      {/* Stock / per-order limit — shows what is left to buy. */}
      {isPreorder ? (
        props.preorderMaxQty ? (
          <p className="text-body text-muted">
            Up to {props.preorderMaxQty} per order.
          </p>
        ) : null
      ) : hasSizes && selectedSize ? (
        <p className="text-body text-muted">
          {selectedSize.stockQuantity} left in {selectedSize.sizeLabel}.
        </p>
      ) : null}

      {/* Primary + secondary action side by side — DESIGN.md §7.5 keeps one
          primary per view, so "Proceed to checkout" uses the Secondary variant.
          Stacked below the sm breakpoint, where two labels will not fit on one
          line at phone width. */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={add}
          disabled={soldOut || atLimit}
          aria-disabled={soldOut || atLimit}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-pill bg-accent px-6 text-body-lg font-medium text-primary shadow-gold-glow transition-transform duration-fast hover:scale-[1.02] disabled:bg-border-default disabled:text-muted disabled:shadow-none disabled:hover:scale-100"
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={proceed}
          disabled={soldOut}
          aria-disabled={soldOut}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-pill border border-border-subtle bg-card px-6 text-body-lg font-medium text-primary transition-colors duration-fast hover:bg-accent-wash disabled:bg-border-default disabled:text-muted"
        >
          Proceed to checkout
        </button>
      </div>

      {/* Live region kept mounted for announcements, but it reserves no height
          until it has something to say (client: less empty space, 2026-10-19). */}
      <p aria-live="polite" className="empty:hidden text-body text-accent-strong">
        {status}
      </p>
      {isPreorder && deposit && depositAmount !== null ? (
        <p className="text-body text-muted">
          Reserve with a {deposit}% deposit of{" "}
          <span className="font-semibold text-primary">
            {formatPrice(depositAmount, currency)}
          </span>
          {props.preorderArrivalDate
            ? ` now — the balance is due before it ships in ${formatArrivalLong(props.preorderArrivalDate)}`
            : " now — the balance is due before it ships"}
          .
        </p>
      ) : null}

      {/* Toast — DESIGN.md §7.19, pinned top-right below the sticky header. */}
      {toast ? (
        <div className="pointer-events-none fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm md:right-6 md:top-24">
          <Toast
            message={toast.message}
            kind={toast.kind}
            onDismiss={clearToast}
          />
        </div>
      ) : null}
    </div>
  );
}
