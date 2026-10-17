/**
 * Cart store — ProductReq.md §8. Client-side only: the cart lives in
 * localStorage and is re-priced and re-validated on the server at checkout
 * (§14.2). Prices stored here are display snapshots, never trusted.
 */

export type CartAvailability = "in_stock" | "pre_order";
export type CartPaymentMode = "full" | "deposit";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  sizeLabel: string;
  quantity: number;
  /** Base-currency unit price snapshot, for display only. */
  unitPriceBase: number;
  availability: CartAvailability;
  preorderArrivalDate: string | null;
  paymentMode: CartPaymentMode;
  depositPercent: number;
  freeDelivery: { allLocations: boolean; locationIds: string[] };
  imageUrl: string | null;
}

export const CART_STORAGE_KEY = "sapphire_cart";
export const MAX_QUANTITY_PER_LINE = 10;

const EMPTY: CartItem[] = [];

let snapshot: CartItem[] = EMPTY;
let lastRaw = "";
const listeners = new Set<() => void>();

function isItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === "string" &&
    typeof v.slug === "string" &&
    typeof v.sizeLabel === "string" &&
    typeof v.quantity === "number" &&
    v.quantity > 0
  );
}

function parse(raw: string): CartItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isItem).map((i) => ({
      ...i,
      quantity: Math.min(Math.max(1, Math.round(i.quantity)), MAX_QUANTITY_PER_LINE),
      freeDelivery: i.freeDelivery ?? { allLocations: false, locationIds: [] },
      paymentMode: i.paymentMode ?? "full",
      depositPercent: i.depositPercent ?? 0,
      imageUrl: i.imageUrl ?? null,
      preorderArrivalDate: i.preorderArrivalDate ?? null,
    }));
  } catch {
    return EMPTY;
  }
}

function readFromStorage(): void {
  let raw = "";
  try {
    raw = window.localStorage.getItem(CART_STORAGE_KEY) ?? "";
  } catch {
    /* storage blocked — cart stays empty for this session */
  }
  if (raw === lastRaw) return;
  lastRaw = raw;
  snapshot = raw ? parse(raw) : EMPTY;
}

function write(items: CartItem[]): void {
  snapshot = items;
  lastRaw = JSON.stringify(items);
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, lastRaw);
  } catch {
    /* storage blocked — cart kept in memory only */
  }
  listeners.forEach((l) => l());
}

function sameLine(a: CartItem, b: Pick<CartItem, "productId" | "sizeLabel">): boolean {
  return a.productId === b.productId && a.sizeLabel === b.sizeLabel;
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = () => {
    readFromStorage();
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): CartItem[] {
  readFromStorage();
  return snapshot;
}

export function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function addItem(item: CartItem): void {
  readFromStorage();
  const next = [...snapshot];
  const idx = next.findIndex((i) => sameLine(i, item));
  if (idx >= 0) {
    next[idx] = {
      ...next[idx],
      ...item,
      quantity: Math.min(
        next[idx].quantity + item.quantity,
        MAX_QUANTITY_PER_LINE,
      ),
    };
  } else {
    next.push({ ...item, quantity: Math.min(item.quantity, MAX_QUANTITY_PER_LINE) });
  }
  write(next);
}

export function setQuantity(
  productId: string,
  sizeLabel: string,
  quantity: number,
): void {
  readFromStorage();
  if (quantity <= 0) {
    removeItem(productId, sizeLabel);
    return;
  }
  write(
    snapshot.map((i) =>
      sameLine(i, { productId, sizeLabel })
        ? { ...i, quantity: Math.min(Math.round(quantity), MAX_QUANTITY_PER_LINE) }
        : i,
    ),
  );
}

export function removeItem(productId: string, sizeLabel: string): void {
  readFromStorage();
  write(snapshot.filter((i) => !sameLine(i, { productId, sizeLabel })));
}

export function clearCart(): void {
  write([]);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotalBase(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.unitPriceBase * i.quantity, 0);
}
