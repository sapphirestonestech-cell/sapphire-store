import { describe, it, expect } from "vitest";
import {
  allowedNextStatuses,
  canCancelOrder,
  canRefundOrder,
  orderFilterQuery,
  ordersToCsv,
  parseOrderFilters,
} from "@/lib/admin/orders";
import type { OrderDoc, OrderStatus } from "@/lib/models/order";

describe("order status transitions", () => {
  it("never allows a manual move to paid", () => {
    for (const status of [
      "pending_payment",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ] as OrderStatus[]) {
      expect(allowedNextStatuses(status)).not.toContain("paid");
    }
  });

  it("walks a paid order through fulfilment", () => {
    expect(allowedNextStatuses("paid")).toEqual(["processing"]);
    expect(allowedNextStatuses("processing")).toEqual(["shipped"]);
    expect(allowedNextStatuses("shipped")).toEqual(["delivered"]);
    expect(allowedNextStatuses("delivered")).toEqual([]);
  });

  it("cancels only before shipping", () => {
    expect(canCancelOrder("pending_payment")).toBe(true);
    expect(canCancelOrder("paid")).toBe(true);
    expect(canCancelOrder("processing")).toBe(true);
    expect(canCancelOrder("shipped")).toBe(false);
    expect(canCancelOrder("cancelled")).toBe(false);
  });

  it("refunds only money that was captured", () => {
    expect(canRefundOrder("pending_payment")).toBe(false);
    expect(canRefundOrder("paid")).toBe(true);
    expect(canRefundOrder("delivered")).toBe(true);
    expect(canRefundOrder("refunded")).toBe(false);
  });
});

describe("parseOrderFilters", () => {
  it("keeps only recognised values", () => {
    expect(
      parseOrderFilters({
        status: "shipped",
        payment: "paid",
        gateway: "paystack",
        availability: "pre_order",
        from: "2026-10-01",
        to: "not-a-date",
      }),
    ).toEqual({
      status: "shipped",
      payment: "paid",
      gateway: "paystack",
      availability: "pre_order",
      location: undefined,
      q: undefined,
      from: "2026-10-01",
      to: undefined,
    });
  });

  it("ignores an unknown status", () => {
    expect(parseOrderFilters({ status: "lost" }).status).toBeUndefined();
  });
});

describe("orderFilterQuery", () => {
  it("treats unpaid as missing or initiated", () => {
    const query = orderFilterQuery({ payment: "unpaid" });
    expect(query).toEqual({
      $and: [
        {
          $or: [
            { paymentStatus: { $exists: false } },
            { paymentStatus: null },
            { paymentStatus: "initiated" },
          ],
        },
      ],
    });
  });

  it("escapes search text before building a regex", () => {
    const query = orderFilterQuery({ q: "a+b" });
    const or = query.$and?.[0]?.$or as { orderNumber: RegExp }[];
    expect(or[0].orderNumber).toBeInstanceOf(RegExp);
    expect(or[0].orderNumber.test("a+b")).toBe(true);
    expect(or[0].orderNumber.test("aab")).toBe(false);
  });

  it("returns an empty query when nothing is filtered", () => {
    expect(orderFilterQuery({})).toEqual({});
  });
});

describe("ordersToCsv", () => {
  it("escapes commas, quotes and newlines", () => {
    const order = {
      orderNumber: "SB-1",
      createdAt: new Date("2026-10-19T10:00:00Z"),
      customer: {
        name: 'Ada "Ade" Okafor',
        email: "ada@example.com",
        phone: "+2348000000000",
        notes: "",
      },
      location: { cityArea: "Lekki, Phase 1", country: "Nigeria" },
      items: [{ name: "Aurora", sizeLabel: "US 7", quantity: 1 }],
      subtotalMinor: 45000,
      deliveryTotalMinor: 800000,
      totalMinor: 845000,
      amountDueNowMinor: 845000,
      amountDueLaterMinor: 0,
      currency: "NGN",
      baseCurrency: "USD",
      exchangeRate: 1600,
      status: "paid",
      paymentStatus: "paid",
      paymentGateway: "paystack",
      paymentReference: "ref_1",
    } as unknown as OrderDoc;

    const csv = ordersToCsv([order]);
    const dataRow = csv.split("\r\n")[1];

    expect(dataRow).toContain('"Ada ""Ade"" Okafor"');
    expect(dataRow).toContain('"Lekki, Phase 1, Nigeria"');
    expect(dataRow).toContain("Aurora (US 7) x1");
    expect(dataRow).toContain("Paid");
  });
});
