"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useSignedIn } from "@/components/signed-in-provider";
import {
  getServerSnapshot,
  getSnapshot,
  replaceAll,
  subscribe,
  wishlistCount,
  type WishlistItem,
} from "@/lib/wishlist";

/** Live view of the signed-in customer's wishlist. */
export function useWishlist(): { items: WishlistItem[]; count: number } {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { items, count: wishlistCount(items) };
}

/**
 * Seeds the client wishlist store from the account once per session. Guests
 * have no wishlist, so this fetches nothing when signed out. A failure leaves
 * the store empty rather than showing a stale list.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const signedIn = useSignedIn();

  useEffect(() => {
    if (!signedIn) {
      replaceAll([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/wishlist");
        if (!res.ok) return;
        const data = (await res.json()) as { items?: { productId: string }[] };
        if (cancelled) return;
        replaceAll((data.items ?? []).map((i) => i.productId));
      } catch {
        /* leave the store empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  return <>{children}</>;
}
