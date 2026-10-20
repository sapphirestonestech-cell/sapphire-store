/**
 * Wishlist store — client-side mirror of the signed-in customer's account
 * wishlist. A guest has no wishlist (client instruction, 2026-10-19), so there
 * is no localStorage layer: the account is the only source of truth, and this
 * store exists so every heart on the page (cards, product page) reflects the
 * same set without a refetch.
 *
 * Seeded once per session by <WishlistProvider> from
 * `GET /api/account/wishlist`; toggles are applied optimistically and rolled
 * back if the API rejects them. Only product ids are held — prices and stock
 * are never read from here.
 */

export interface WishlistItem {
  productId: string;
}

export const WISHLIST_MAX = 100;

const EMPTY: WishlistItem[] = [];

let snapshot: WishlistItem[] = EMPTY;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getSnapshot(): WishlistItem[] {
  return snapshot;
}

export function getServerSnapshot(): WishlistItem[] {
  return EMPTY;
}

export function has(productId: string): boolean {
  return snapshot.some((i) => i.productId === productId);
}

export function wishlistCount(items: WishlistItem[]): number {
  return items.length;
}

/** Replace the whole list — used when the provider seeds from the API. */
export function replaceAll(productIds: string[]): void {
  snapshot = productIds.slice(0, WISHLIST_MAX).map((productId) => ({ productId }));
  emit();
}

/** Optimistically add; returns false when already present or the list is full. */
export function addItem(productId: string): boolean {
  if (snapshot.some((i) => i.productId === productId)) return false;
  if (snapshot.length >= WISHLIST_MAX) return false;
  snapshot = [{ productId }, ...snapshot];
  emit();
  return true;
}

/** Optimistically remove. */
export function removeItem(productId: string): void {
  const next = snapshot.filter((i) => i.productId !== productId);
  if (next.length === snapshot.length) return;
  snapshot = next;
  emit();
}
