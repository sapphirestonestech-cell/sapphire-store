import { describe, it, expect } from "vitest";
import {
  convertAmount,
  formatPrice,
  priceIn,
  roundAmount,
  DEFAULT_ROUNDING,
} from "@/lib/currency";

describe("convertAmount", () => {
  it("multiplies USD into NGN", () => {
    expect(convertAmount(45, 1600, "USD", "NGN")).toBe(72000);
  });

  it("divides NGN into USD", () => {
    expect(convertAmount(80000, 1600, "NGN", "USD")).toBe(50);
  });

  it("returns the amount unchanged for the same currency", () => {
    expect(convertAmount(45, 1600, "USD", "USD")).toBe(45);
  });

  it("refuses a non-positive rate", () => {
    expect(() => convertAmount(45, 0, "USD", "NGN")).toThrow();
  });
});

describe("roundAmount", () => {
  it("rounds USD to two decimals", () => {
    expect(roundAmount(45.678, "USD")).toBe(45.68);
  });

  it("rounds NGN to the nearest 50 by default", () => {
    expect(roundAmount(72019, "NGN")).toBe(72000);
    expect(roundAmount(72030, "NGN")).toBe(72050);
  });

  it("honours a custom NGN step", () => {
    expect(
      roundAmount(72019, "NGN", { usdDecimals: 2, ngnNearest: 100 }),
    ).toBe(72000);
  });
});

describe("priceIn", () => {
  it("converts and rounds a USD price into NGN", () => {
    expect(priceIn(45, "USD", "NGN", 1600)).toBe(72000);
  });

  it("converts a NGN price into a two-decimal USD price", () => {
    // 72,333 NGN / 1600 = 45.208… → 45.21
    expect(priceIn(72333, "NGN", "USD", 1600)).toBe(45.21);
  });

  it("uses the default rounding when none is supplied", () => {
    expect(priceIn(45, "USD", "USD", 1600)).toBe(
      roundAmount(45, "USD", DEFAULT_ROUNDING),
    );
  });
});

describe("formatPrice", () => {
  it("formats USD with a dollar sign and two decimals", () => {
    expect(formatPrice(45, "USD")).toBe("$45.00");
  });

  it("groups thousands and keeps two decimals for USD", () => {
    expect(formatPrice(1234.5, "USD")).toBe("$1,234.50");
  });

  it("formats NGN with the naira sign and no decimals", () => {
    expect(formatPrice(72000, "NGN")).toBe("₦72,000");
  });
});
