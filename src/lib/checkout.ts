/**
 * Checkout maths — ProductReq.md §9, §10. Pure and side-effect free so the
 * browser can preview totals and the server can authoritatively recompute
 * them from the database (never trusting client prices, AGENTS.md §9).
 *
 * Money is handled in integer **minor units** of the base currency
 * (USD cents, NGN kobo). `toMinor` converts a base-currency amount
 * (e.g. a product's `basePrice` of 45.00 → 4500).
 */

export const MINOR_PER_UNIT = 100;

/** Base-currency amount (dollars) → integer minor units. */
export function toMinor(amount: number): number {
  return Math.round(amount * MINOR_PER_UNIT);
}

/** Integer minor units → base-currency amount. */
export function fromMinor(minor: number): number {
  return minor / MINOR_PER_UNIT;
}

export type Availability = "in_stock" | "pre_order";
export type PaymentMode = "full" | "deposit";

export interface CheckoutItemInput {
  productId: string;
  name: string;
  slug: string;
  sizeLabel: string;
  quantity: number;
  /** Price in the base currency, as stored on the product. */
  unitPriceBase: number;
  availability: Availability;
  preorderArrivalDate: string | null;
  paymentMode: PaymentMode;
  depositPercent: number;
  freeDelivery: { allLocations: boolean; locationIds: string[] };
  imageUrl?: string;
}

export interface LocationFeeInput {
  id: string;
  country: string;
  region?: string;
  cityArea: string;
  instockFee: number;
  preorderFee: number;
  minDays: number;
  maxDays: number;
}

export interface ComputedItem extends CheckoutItemInput {
  unitPriceMinor: number;
  lineTotalMinor: number;
  /** Amount payable now for this line (in full, or the deposit). */
  dueNowMinor: number;
  /** Balance payable later (deposit remainder; 0 otherwise). */
  dueLaterMinor: number;
}

export interface ComputedShipment {
  kind: Availability;
  arrivalDate: string | null;
  itemIndexes: number[];
  minDays: number;
  maxDays: number;
  /** Fee in minor units after the free-delivery rule. */
  deliveryFeeMinor: number;
  freeDelivery: boolean;
}

export interface OrderTotals {
  items: ComputedItem[];
  shipments: ComputedShipment[];
  subtotalMinor: number;
  deliveryTotalMinor: number;
  totalMinor: number;
  amountDueNowMinor: number;
  amountDueLaterMinor: number;
}

/**
 * A single item's delivery is free for a location when the admin marked it
 * free everywhere, or for that specific location.
 */
export function itemIsFreeForLocation(
  item: Pick<CheckoutItemInput, "freeDelivery">,
  locationId: string,
): boolean {
  if (item.freeDelivery.allLocations) return true;
  return item.freeDelivery.locationIds.includes(locationId);
}

/** Whole-line money for one item, including the deposit split. */
function computeItem(item: CheckoutItemInput): ComputedItem {
  const unitPriceMinor = toMinor(item.unitPriceBase);
  const lineTotalMinor = unitPriceMinor * item.quantity;

  let dueNowMinor = lineTotalMinor;
  let dueLaterMinor = 0;

  if (item.availability === "pre_order" && item.paymentMode === "deposit") {
    dueNowMinor = Math.round((lineTotalMinor * item.depositPercent) / 100);
    dueLaterMinor = lineTotalMinor - dueNowMinor;
  }

  return {
    ...item,
    unitPriceMinor,
    lineTotalMinor,
    dueNowMinor,
    dueLaterMinor,
  };
}

function latestArrival(items: ComputedItem[]): string | null {
  let latest: number | null = null;
  for (const item of items) {
    if (!item.preorderArrivalDate) continue;
    const t = new Date(item.preorderArrivalDate).getTime();
    if (!Number.isNaN(t) && (latest === null || t > latest)) latest = t;
  }
  return latest === null ? null : new Date(latest).toISOString();
}

/**
 * Total an order for a chosen delivery location. In-stock and pre-order
 * items form separate shipments, each charged the location's fee once —
 * unless **every** ring in that shipment is free-delivery for the location
 * (Phase 2 decision).
 */
export function computeOrderTotals(
  items: CheckoutItemInput[],
  location: LocationFeeInput,
): OrderTotals {
  const computed = items.map(computeItem);

  const inStock = computed.filter((i) => i.availability === "in_stock");
  const preOrder = computed.filter((i) => i.availability === "pre_order");

  const shipments: ComputedShipment[] = [];

  const buildShipment = (
    kind: Availability,
    group: ComputedItem[],
    feeBase: number,
  ) => {
    if (group.length === 0) return;
    const allFree = group.every((i) => itemIsFreeForLocation(i, location.id));
    shipments.push({
      kind,
      arrivalDate: kind === "pre_order" ? latestArrival(group) : null,
      itemIndexes: group.map((i) => computed.indexOf(i)),
      minDays: location.minDays,
      maxDays: location.maxDays,
      deliveryFeeMinor: allFree ? 0 : toMinor(feeBase),
      freeDelivery: allFree,
    });
  };

  buildShipment("in_stock", inStock, location.instockFee);
  buildShipment("pre_order", preOrder, location.preorderFee);

  const subtotalMinor = computed.reduce((s, i) => s + i.lineTotalMinor, 0);
  const deliveryTotalMinor = shipments.reduce(
    (s, sh) => s + sh.deliveryFeeMinor,
    0,
  );
  const totalMinor = subtotalMinor + deliveryTotalMinor;
  const amountDueNowMinor =
    computed.reduce((s, i) => s + i.dueNowMinor, 0) + deliveryTotalMinor;
  const amountDueLaterMinor = computed.reduce((s, i) => s + i.dueLaterMinor, 0);

  return {
    items: computed,
    shipments,
    subtotalMinor,
    deliveryTotalMinor,
    totalMinor,
    amountDueNowMinor,
    amountDueLaterMinor,
  };
}
