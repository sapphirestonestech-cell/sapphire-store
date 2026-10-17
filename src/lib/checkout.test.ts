import { describe, it, expect } from "vitest";
import {
  computeOrderTotals,
  fromMinor,
  itemIsFreeForLocation,
  toMinor,
  type CheckoutItemInput,
  type LocationFeeInput,
} from "@/lib/checkout";

const LOCATION: LocationFeeInput = {
  id: "loc-lagos",
  country: "Nigeria",
  region: "Lagos",
  cityArea: "Lagos Island",
  instockFee: 8,
  preorderFee: 12,
  minDays: 2,
  maxDays: 5,
};

const OTHER_LOCATION: LocationFeeInput = { ...LOCATION, id: "loc-abuja" };

function item(over: Partial<CheckoutItemInput> = {}): CheckoutItemInput {
  return {
    productId: "p1",
    name: "Aurelia Solitaire",
    slug: "aurelia-solitaire",
    sizeLabel: "US 6",
    quantity: 1,
    unitPriceBase: 68,
    availability: "in_stock",
    preorderArrivalDate: null,
    paymentMode: "full",
    depositPercent: 0,
    freeDelivery: { allLocations: false, locationIds: [] },
    ...over,
  };
}

describe("money helpers", () => {
  it("converts base amounts to minor units", () => {
    expect(toMinor(45)).toBe(4500);
    expect(toMinor(45.005)).toBe(4501);
    expect(fromMinor(4500)).toBe(45);
  });
});

describe("itemIsFreeForLocation", () => {
  it("is free everywhere when allLocations is set", () => {
    expect(
      itemIsFreeForLocation(
        { freeDelivery: { allLocations: true, locationIds: [] } },
        "loc-abuja",
      ),
    ).toBe(true);
  });

  it("is free only for listed locations", () => {
    const free = { freeDelivery: { allLocations: false, locationIds: ["loc-lagos"] } };
    expect(itemIsFreeForLocation(free, "loc-lagos")).toBe(true);
    expect(itemIsFreeForLocation(free, "loc-abuja")).toBe(false);
  });
});

describe("computeOrderTotals", () => {
  it("charges one in-stock shipment fee and totals correctly", () => {
    const totals = computeOrderTotals([item({ quantity: 2 })], LOCATION);
    expect(totals.subtotalMinor).toBe(13600);
    expect(totals.deliveryTotalMinor).toBe(800);
    expect(totals.totalMinor).toBe(14400);
    expect(totals.amountDueNowMinor).toBe(14400);
    expect(totals.amountDueLaterMinor).toBe(0);
    expect(totals.shipments).toHaveLength(1);
    expect(totals.shipments[0].kind).toBe("in_stock");
  });

  it("splits in-stock and pre-order into separate shipments, each charged once", () => {
    const totals = computeOrderTotals(
      [
        item({ productId: "a" }),
        item({
          productId: "b",
          availability: "pre_order",
          paymentMode: "full",
          preorderArrivalDate: "2026-12-01T00:00:00.000Z",
        }),
      ],
      LOCATION,
    );
    expect(totals.shipments).toHaveLength(2);
    expect(totals.deliveryTotalMinor).toBe(800 + 1200);
    expect(totals.shipments[1].arrivalDate).toBe("2026-12-01T00:00:00.000Z");
  });

  it("waives a shipment's fee only when every ring in it is free", () => {
    const mixed = computeOrderTotals(
      [
        item({ productId: "a", freeDelivery: { allLocations: true, locationIds: [] } }),
        item({ productId: "b" }),
      ],
      LOCATION,
    );
    expect(mixed.deliveryTotalMinor).toBe(800);

    const allFree = computeOrderTotals(
      [
        item({ productId: "a", freeDelivery: { allLocations: true, locationIds: [] } }),
        item({
          productId: "b",
          freeDelivery: { allLocations: false, locationIds: ["loc-lagos"] },
        }),
      ],
      LOCATION,
    );
    expect(allFree.deliveryTotalMinor).toBe(0);
    expect(allFree.shipments[0].freeDelivery).toBe(true);
  });

  it("does not waive delivery for a location the product is not free to", () => {
    const totals = computeOrderTotals(
      [
        item({
          productId: "a",
          freeDelivery: { allLocations: false, locationIds: ["loc-lagos"] },
        }),
      ],
      OTHER_LOCATION,
    );
    expect(totals.deliveryTotalMinor).toBe(800);
  });

  it("splits a deposit pre-order into due now and due later", () => {
    const totals = computeOrderTotals(
      [
        item({
          availability: "pre_order",
          paymentMode: "deposit",
          depositPercent: 30,
          unitPriceBase: 110,
          preorderArrivalDate: "2026-12-01T00:00:00.000Z",
        }),
      ],
      LOCATION,
    );
    // 110.00 → 11000; deposit 30% = 3300 now, 7700 later
    expect(totals.subtotalMinor).toBe(11000);
    expect(totals.amountDueLaterMinor).toBe(7700);
    // due now = deposit (3300) + pre-order delivery fee (1200)
    expect(totals.amountDueNowMinor).toBe(3300 + 1200);
  });

  it("charges an in-stock line in full even if the store also has deposits", () => {
    const totals = computeOrderTotals(
      [
        item({ availability: "in_stock", paymentMode: "full" }),
        item({
          productId: "b",
          availability: "pre_order",
          paymentMode: "deposit",
          depositPercent: 50,
          unitPriceBase: 100,
          preorderArrivalDate: "2026-12-01T00:00:00.000Z",
        }),
      ],
      LOCATION,
    );
    // in-stock 6800 now + pre-order deposit 5000 now = 11800, + fees 800 + 1200
    expect(totals.amountDueNowMinor).toBe(6800 + 5000 + 800 + 1200);
    expect(totals.amountDueLaterMinor).toBe(5000);
    expect(totals.totalMinor).toBe(6800 + 10000 + 800 + 1200);
  });

  it("returns zero totals for an empty cart", () => {
    const totals = computeOrderTotals([], LOCATION);
    expect(totals.totalMinor).toBe(0);
    expect(totals.shipments).toHaveLength(0);
  });
});
