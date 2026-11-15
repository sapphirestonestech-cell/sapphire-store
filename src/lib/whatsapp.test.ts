import { describe, it, expect } from "vitest";
import {
  SUPPORT_WHATSAPP_MESSAGE,
  normalizeWhatsAppNumber,
  whatsAppNumber,
  whatsAppUrl,
} from "@/lib/whatsapp";

describe("normalizeWhatsAppNumber", () => {
  it("turns the store's local number into wa.me form", () => {
    expect(normalizeWhatsAppNumber("09075466201")).toBe("2349075466201");
  });

  it("accepts international formatting", () => {
    expect(normalizeWhatsAppNumber("+234 907 546 6201")).toBe("2349075466201");
    expect(normalizeWhatsAppNumber("234-907-546-6201")).toBe("2349075466201");
  });

  it("rejects empty and impossible numbers", () => {
    expect(normalizeWhatsAppNumber(undefined)).toBeNull();
    expect(normalizeWhatsAppNumber("")).toBeNull();
    expect(normalizeWhatsAppNumber("123")).toBeNull();
    expect(normalizeWhatsAppNumber("1234567890123456")).toBeNull();
  });
});

describe("whatsAppUrl", () => {
  it("builds a wa.me link with the prefilled support message", () => {
    expect(
      whatsAppUrl(SUPPORT_WHATSAPP_MESSAGE, {
        NEXT_PUBLIC_WHATSAPP_NUMBER: "09075466201",
      }),
    ).toBe(
      `https://wa.me/2349075466201?text=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`,
    );
  });

  it("falls back to WHATSAPP_NUMBER and returns null when unset", () => {
    expect(whatsAppNumber({ WHATSAPP_NUMBER: "09075466201" })).toBe(
      "2349075466201",
    );
    expect(whatsAppUrl("Hi", {})).toBeNull();
  });
});
