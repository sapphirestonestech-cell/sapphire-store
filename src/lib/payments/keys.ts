/**
 * Payment mode keys — DECISIONS 2026-10-29.
 *
 * Every gateway has two secret keys, one per mode, and they live only in the
 * server environment (never in the admin database). The admin chooses which
 * mode a gateway uses; this module is the only place that maps a mode to its
 * env var and checks the key's prefix before it is sent anywhere.
 */

export type PaymentMode = "test" | "live";
export type KeyGateway = "paystack" | "bachs";

const ENV_NAMES: Record<KeyGateway, Record<PaymentMode, string>> = {
  paystack: {
    test: "PAYSTACK_TEST_SECRET_KEY",
    live: "PAYSTACK_LIVE_SECRET_KEY",
  },
  bachs: {
    test: "BACHS_TEST_SECRET_KEY",
    live: "BACHS_LIVE_SECRET_KEY",
  },
};

/**
 * Paystack test/live keys are `sk_test_` / `sk_live_`. BACHS sandbox keys use
 * `sk_sandbox_` and production keys use `sk_live_`. A key that does not match
 * the mode it was configured for is treated as missing: sending a live key to
 * the sandbox (or the reverse) would charge the wrong environment.
 */
const PREFIXES: Record<KeyGateway, Record<PaymentMode, string>> = {
  paystack: { test: "sk_test_", live: "sk_live_" },
  bachs: { test: "sk_sandbox_", live: "sk_live_" },
};

/**
 * Migration fallback: production still holds its live keys under the old
 * single-key names, and Helicarrier masks values so they cannot be copied into
 * the new variables. Live mode therefore falls back to the old variable until
 * an explicit `*_LIVE_SECRET_KEY` is set. Test mode never falls back.
 */
const LEGACY_LIVE_ENV: Record<KeyGateway, string> = {
  paystack: "PAYSTACK_SECRET_KEY",
  bachs: "BACHS_SECRET_KEY",
};

export interface KeyStatus {
  configured: boolean;
  /** Admin-facing reason when the mode cannot be used. Never includes a key. */
  reason?: string;
}

export function isPaymentMode(value: unknown): value is PaymentMode {
  return value === "test" || value === "live";
}

/** Legacy orders and settings have no mode; they were all live. */
export function paymentModeOrDefault(value: unknown): PaymentMode {
  return value === "test" ? "test" : "live";
}

export function gatewayKeyEnvName(
  gateway: KeyGateway,
  mode: PaymentMode,
): string {
  return ENV_NAMES[gateway][mode];
}

export function gatewayKeyPrefix(
  gateway: KeyGateway,
  mode: PaymentMode,
): string {
  return PREFIXES[gateway][mode];
}

/**
 * The usable key for a gateway/mode, or null when absent or configured for the
 * other mode. Callers must treat null as "this mode is unavailable".
 */
function readEnvKey(
  gateway: KeyGateway,
  mode: PaymentMode,
): { key: string | null; envName: string; legacy: boolean } {
  const envName = ENV_NAMES[gateway][mode];
  const primary = process.env[envName]?.trim();
  if (primary) return { key: primary, envName, legacy: false };

  if (mode === "live") {
    const legacyName = LEGACY_LIVE_ENV[gateway];
    const legacy = process.env[legacyName]?.trim();
    if (legacy) return { key: legacy, envName: legacyName, legacy: true };
  }

  return { key: null, envName, legacy: false };
}

export function readGatewayKey(
  gateway: KeyGateway,
  mode: PaymentMode,
): string | null {
  const { key, legacy } = readEnvKey(gateway, mode);
  if (!key) return null;
  // The legacy live key was already in use before modes existed; keep it
  // working as-is so deploying this change cannot break live payments.
  if (legacy) return key;
  return key.startsWith(PREFIXES[gateway][mode]) ? key : null;
}

export function gatewayKeyStatus(
  gateway: KeyGateway,
  mode: PaymentMode,
): KeyStatus {
  const { key, envName, legacy } = readEnvKey(gateway, mode);
  if (!key) {
    return {
      configured: false,
      reason:
        mode === "live"
          ? `Add ${envName} (or the legacy ${LEGACY_LIVE_ENV[gateway]}) to the server environment to use live mode.`
          : `Add ${envName} to the server environment to use test mode.`,
    };
  }
  if (legacy) return { configured: true };
  if (!key.startsWith(PREFIXES[gateway][mode])) {
    return {
      configured: false,
      reason: `${envName} does not start with ${PREFIXES[gateway][mode]}. Check that the ${mode} key is in the ${mode} variable.`,
    };
  }
  return { configured: true };
}

export type GatewayKeysStatus = Record<
  KeyGateway,
  Record<PaymentMode, KeyStatus>
>;

export function gatewayKeysStatus(): GatewayKeysStatus {
  return {
    paystack: {
      test: gatewayKeyStatus("paystack", "test"),
      live: gatewayKeyStatus("paystack", "live"),
    },
    bachs: {
      test: gatewayKeyStatus("bachs", "test"),
      live: gatewayKeyStatus("bachs", "live"),
    },
  };
}
