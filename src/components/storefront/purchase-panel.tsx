"use client";

import { useState } from "react";
import { addItem } from "@/lib/cart";
import { useCart } from "@/components/cart-provider";
import { formatArrivalLong } from "@/lib/format";
import { priceIn, formatPrice } from "@/lib/currency";
import { useCurrency } from "@/components/currency-provider";

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
  /* Human-readable labels for the locations this ring ships free to. */
  freeDeliveryLabels?: string[];
}

/**
 * Purchase panel — DESIGN.md §7.13/§7.14. Size pills, add to cart, and the
 * pre-order / free-delivery terms. No payment happens here; checkout carries
 * the cart forward.
 */
export function PurchasePanel(props: PurchasePanelProps) {
  const { currency, usdToNgn, baseCurrency } = useCurrency();
  const { items } = useCart();
  const isPreorder = props.availability === "pre_order";
  const soldOut =
    !isPreorder &&
    props.sizes.length > 0 &&
    props.sizes.every((s) => s.stockQuantity === 0);

  const [selected, setSelected] = useState<string | null>(
    props.sizes.length === 1 ? props.sizes[0].sizeLabel : null,
  );
  const [flash, setFlash] = useState<string | null>(null);

  const inCart = selected
    ? (items.find(
        (i) => i.productId === props.productId && i.sizeLabel === selected,
      )?.quantity ?? 0)
    : 0;

  const needsSize = props.sizes.length > 0 && !selected;

  function add() {
    if (needsSize) {
      setFlash("Choose a size first.");
      return;
    }
    addItem({
      productId: props.productId,
      slug: props.slug,
      name: props.name,
      sizeLabel: selected ?? "One size",
      quantity: 1,
      unitPriceBase: props.basePrice,
      availability: props.availability,
      preorderArrivalDate: props.preorderArrivalDate,
      paymentMode: props.paymentMode,
      depositPercent: props.depositPercent ?? 0,
      freeDelivery: props.freeDelivery,
      imageUrl: props.imageUrl,
    });
    setFlash(`${props.name} added to your cart.`);
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

  return (
    <div className="space-y-4">
      {props.sizes.length > 0 ? (
        <div className="space-y-2">
          <p id="size-label" className="text-body font-medium">
            Size
          </p>
          <div
            role="group"
            aria-labelledby="size-label"
            className="flex flex-wrap gap-2"
          >
            {props.sizes.map((s) => {
              const unavailable = s.stockQuantity === 0;
              const active = s.sizeLabel === selected;
              return (
                <button
                  key={s.sizeLabel}
                  type="button"
                  disabled={unavailable}
                  aria-pressed={active}
                  onClick={() => {
                    setSelected(s.sizeLabel);
                    setFlash(null);
                  }}
                  className={[
                    "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-4 text-body font-medium transition-colors duration-fast",
                    unavailable
                      ? "cursor-not-allowed text-pale-sand"
                      : active
                        ? "bg-warm-ink text-ivory-canvas"
                        : "border border-hairline bg-pure-white text-warm-ink hover:bg-gold-wash",
                  ].join(" ")}
                >
                  {s.sizeLabel}
                  {unavailable ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-pale-sand"
                      />
                      <span className="sr-only"> (unavailable)</span>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={add}
        disabled={soldOut}
        aria-disabled={soldOut}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow disabled:bg-pale-sand disabled:text-soft-taupe disabled:shadow-none"
      >
        {soldOut ? "Sold out" : isPreorder ? "Pre-order now" : "Add to cart"}
      </button>

      <p aria-live="polite" className="min-h-5 text-body text-deep-gold">
        {flash ?? (inCart > 0 ? `${inCart} in your cart` : "\u00a0")}
      </p>

      {isPreorder && deposit && depositAmount !== null ? (
        <p className="text-body text-soft-taupe">
          Reserve with a {deposit}% deposit of{" "}
          <span className="font-semibold text-warm-ink">
            {formatPrice(depositAmount, currency)}
          </span>
          {props.preorderArrivalDate
            ? ` now — the balance is due before it ships in ${formatArrivalLong(props.preorderArrivalDate)}`
            : " now — the balance is due before it ships"}
          .
        </p>
      ) : null}

      {props.freeDelivery.allLocations ? (
        <p className="text-body text-soft-taupe">Free delivery everywhere.</p>
      ) : (props.freeDeliveryLabels?.length ?? 0) > 0 ? (
        <p className="text-body text-soft-taupe">
          Free delivery to {props.freeDeliveryLabels!.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
