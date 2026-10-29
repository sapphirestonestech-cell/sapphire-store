import { afterEach, describe, expect, it } from "vitest";
import {
  gatewayKeyEnvName,
  gatewayKeyStatus,
  isPaymentMode,
  paymentModeOrDefault,
  readGatewayKey,
} from "@/lib/payments/keys";

const TOUCHED = [
  "PAYSTACK_TEST_SECRET_KEY",
  "PAYSTACK_LIVE_SECRET_KEY",
  "BACHS_TEST_SECRET_KEY",
  "BACHS_LIVE_SECRET_KEY",
  "PAYSTACK_SECRET_KEY",
  "BACHS_SECRET_KEY",
] as const;

afterEach(() => {
  for (const name of TOUCHED) delete process.env[name];
});

describe("payment mode keys", () => {
  it("maps each gateway and mode to its env var", () => {
    expect(gatewayKeyEnvName("paystack", "test")).toBe(
      "PAYSTACK_TEST_SECRET_KEY",
    );
    expect(gatewayKeyEnvName("paystack", "live")).toBe(
      "PAYSTACK_LIVE_SECRET_KEY",
    );
    expect(gatewayKeyEnvName("bachs", "test")).toBe("BACHS_TEST_SECRET_KEY");
    expect(gatewayKeyEnvName("bachs", "live")).toBe("BACHS_LIVE_SECRET_KEY");
  });

  it("returns a key only when its prefix matches the mode", () => {
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_abc";
    process.env.PAYSTACK_LIVE_SECRET_KEY = "sk_test_wrong";
    process.env.BACHS_TEST_SECRET_KEY = "sk_sandbox_abc";
    process.env.BACHS_LIVE_SECRET_KEY = "sk_live_abc";

    expect(readGatewayKey("paystack", "test")).toBe("sk_test_abc");
    expect(readGatewayKey("paystack", "live")).toBeNull();
    expect(readGatewayKey("bachs", "test")).toBe("sk_sandbox_abc");
    expect(readGatewayKey("bachs", "live")).toBe("sk_live_abc");
  });

  it("falls back to the legacy live variable during migration", () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_live_legacy";
    process.env.BACHS_SECRET_KEY = "sk_live_legacy";
    expect(readGatewayKey("paystack", "live")).toBe("sk_live_legacy");
    expect(readGatewayKey("bachs", "live")).toBe("sk_live_legacy");
    expect(gatewayKeyStatus("paystack", "live").configured).toBe(true);
  });

  it("never uses the legacy variable for test mode", () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_live_legacy";
    expect(readGatewayKey("paystack", "test")).toBeNull();
  });

  it("treats an absent key as unavailable", () => {
    expect(readGatewayKey("paystack", "live")).toBeNull();
    const status = gatewayKeyStatus("paystack", "live");
    expect(status.configured).toBe(false);
    expect(status.reason).toContain("PAYSTACK_LIVE_SECRET_KEY");
  });

  it("explains a key configured for the wrong mode", () => {
    process.env.PAYSTACK_LIVE_SECRET_KEY = "sk_test_abc";
    const status = gatewayKeyStatus("paystack", "live");
    expect(status.configured).toBe(false);
    expect(status.reason).toContain("sk_live_");
  });

  it("only accepts the two known modes", () => {
    expect(isPaymentMode("test")).toBe(true);
    expect(isPaymentMode("live")).toBe(true);
    expect(isPaymentMode("sandbox")).toBe(false);
    expect(isPaymentMode(undefined)).toBe(false);
  });

  it("treats legacy rows without a mode as live", () => {
    expect(paymentModeOrDefault(undefined)).toBe("live");
    expect(paymentModeOrDefault(null)).toBe("live");
    expect(paymentModeOrDefault("test")).toBe("test");
    expect(paymentModeOrDefault("live")).toBe("live");
  });
});
