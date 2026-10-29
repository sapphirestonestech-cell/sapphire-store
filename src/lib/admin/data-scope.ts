import type { OrderFilter } from "@/lib/admin/orders";
import type { PaymentMode } from "@/lib/payments/keys";

/**
 * Back-office Live/Test data scope — DECISIONS 2026-10-29.
 *
 * This is independent of the gateway mode: it only decides which orders the
 * admin screens read. Orders written before the field existed were live.
 */

export type DataScope = PaymentMode;

export const DATA_SCOPE_COOKIE = "admin_data_scope";

export function parseDataScope(value: unknown): DataScope {
  return value === "test" ? "test" : "live";
}

/** Mongo condition selecting the orders that belong to one scope. */
export function dataScopeFilter(scope: DataScope): OrderFilter {
  if (scope === "test") {
    return { paymentMode: "test" };
  }
  return {
    $or: [
      { paymentMode: "live" },
      { paymentMode: { $exists: false } },
      { paymentMode: null },
    ],
  };
}
