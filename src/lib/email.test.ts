import { describe, it, expect } from "vitest";
import { displayMoney, formatEmailMoney, paidAmount } from "@/lib/email";

describe("formatEmailMoney", () => {
  it("formats USD with cents and NGN as whole naira", () => {
    expect(formatEmailMoney(12345, "USD")).toBe("$123.45");
    expect(formatEmailMoney(16000000, "NGN")).toBe("₦160,000");
  });
});

describe("paidAmount", () => {
  it("prefers the exact amount and currency sent to the gateway", () => {
    expect(
      paidAmount({
        paymentAmountMinor: 25000000,
        paymentCurrency: "NGN",
        amountDueNowMinor: 16000000,
        currency: "USD",
      }),
    ).toEqual({ minor: 25000000, currency: "NGN" });
  });

  it("falls back to the items due now in the order currency", () => {
    expect(
      paidAmount({
        paymentAmountMinor: null,
        paymentCurrency: null,
        amountDueNowMinor: 4500,
        currency: "USD",
      }),
    ).toEqual({ minor: 4500, currency: "USD" });
  });
});

describe("displayMoney", () => {
  // Order `*Minor` fields are stored in the base currency; the email must
  // apply the frozen exchange rate before formatting (DECISIONS 2026-11-16).
  it("converts base-currency minor units into the display currency", () => {
    expect(
      displayMoney(4500, {
        baseCurrency: "USD",
        currency: "NGN",
        exchangeRate: 1600,
      }),
    ).toBe("₦72,000");
  });

  it("leaves same-currency amounts alone", () => {
    expect(
      displayMoney(4500, {
        baseCurrency: "USD",
        currency: "USD",
        exchangeRate: 1600,
      }),
    ).toBe("$45.00");
  });
});
