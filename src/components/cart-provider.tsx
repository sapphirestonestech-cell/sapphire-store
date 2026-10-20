"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  cartCount,
  cartSubtotalBase,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type CartItem,
} from "@/lib/cart";

/** Live view of the cart, hydration-safe (server snapshot is empty). */
export function useCart(): { items: CartItem[]; count: number; subtotalBase: number } {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    items,
    count: cartCount(items),
    subtotalBase: cartSubtotalBase(items),
  };
}

/** Header cart icon with a live count badge (DESIGN.md §7.2). */
export function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className="relative flex size-11 items-center justify-center rounded-pill text-primary hover:bg-accent-wash"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 6h12l-1 10H5L4 6z" strokeLinejoin="round" />
        <path d="M7.5 6a2.5 2.5 0 015 0" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-sm bg-accent px-1 text-label font-semibold text-primary tabular">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
