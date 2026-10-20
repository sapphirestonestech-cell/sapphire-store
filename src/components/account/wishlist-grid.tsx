"use client";

import Link from "next/link";
import { Price } from "@/components/price";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { addItem, type CartItem } from "@/lib/cart";
import { useCart } from "@/components/cart-provider";
import { removeItem as removeFromWishlistStore } from "@/lib/wishlist";
import type { WishlistView } from "@/lib/wishlist-view";

/**
 * Wishlist grid (account page). The server rendered the rows (live product
 * data); this adds the two actions per ring. Rings with sizes must be added
 * from their page (a size has to be chosen first); one-size rings add straight
 * away. Removal is optimistic against the shared wishlist store and mirrored
 * to the account, rolling back on failure.
 */
export function WishlistGrid({ items }: { items: WishlistView[] }) {
  const { items: cart } = useCart();

  function remove(productId: string) {
    removeFromWishlistStore(productId);
    fetch(`/api/account/wishlist/${productId}`, { method: "DELETE" }).catch(
      () => null,
    );
  }

  function add(v: WishlistView) {
    const product = v.product;
    if (!product || product.sizes.length > 0) return;
    if (cart.some((i) => i.productId === product.id)) return;
    const line: CartItem = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sizeLabel: "One size",
      quantity: 1,
      unitPriceBase: product.basePrice,
      availability: product.availability,
      preorderArrivalDate: product.preorderArrivalDate,
      paymentMode: product.paymentMode,
      depositPercent: product.depositPercent ?? 0,
      freeDelivery: product.freeDelivery,
      imageUrl: product.coverImage?.url ?? null,
    };
    addItem(line);
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {items.map((v) => {
        const product = v.product;
        if (!product) return null;
        const needsSize = product.sizes.length > 0;
        const inCart = cart.some((i) => i.productId === product.id);
        const cover = product.coverImage;
        return (
          <li
            key={v.productId}
            className="flex gap-4 rounded-md bg-card p-4 shadow-card"
          >
            <Link
              href={`/product/${product.slug}`}
              className="relative block size-24 shrink-0 overflow-hidden rounded-sm bg-app"
            >
              {cover?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover.url}
                  alt={`${cover.label ?? "Product"} — ${product.name}`}
                  className="size-full object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center text-label text-accent-strong">
                  Ring
                </span>
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/product/${product.slug}`}
                className="text-body font-medium text-primary underline-offset-4 hover:underline"
              >
                {product.name}
              </Link>
              <p className="mt-1 text-body-lg font-semibold">
                <Price amount={product.basePrice} />
              </p>
              <div className="mt-1">
                <AvailabilityBadge
                  availability={product.availability}
                  arrivalDate={product.preorderArrivalDate}
                />
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                {needsSize ? (
                  <Link
                    href={`/product/${product.slug}`}
                    className="inline-flex min-h-9 items-center rounded-pill bg-accent px-4 text-body font-medium text-primary"
                  >
                    Choose size
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => add(v)}
                    disabled={inCart}
                    className="inline-flex min-h-9 items-center rounded-pill bg-accent px-4 text-body font-medium text-primary disabled:bg-border-default disabled:text-muted"
                  >
                    {inCart ? "In cart" : "Add to cart"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(v.productId)}
                  className="inline-flex min-h-9 items-center rounded-pill border border-border-subtle px-4 text-body text-muted transition-colors hover:bg-accent-wash hover:text-primary"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
