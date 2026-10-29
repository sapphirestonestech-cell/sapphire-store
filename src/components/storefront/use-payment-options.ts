"use client";

import { useEffect, useState } from "react";
import type { Currency } from "@/lib/currency";
import type { Gateway } from "@/lib/payments/gateways";

export interface PaymentOptions {
  gateways: Array<{ id: Gateway }>;
  allowCurrencyChoice: boolean;
  chargeCurrency: Currency;
  displayCurrency: Currency;
  baseCurrency: Currency;
  chargeAmountMinor?: number;
}

interface OptionsResult {
  key: string;
  options: PaymentOptions | null;
  error: string | null;
}

/**
 * Loads the gateways a customer may see for this order/currency. The server
 * decides whether USD is allowed; the selected charge currency is sent back
 * so the choice can be validated again at initialize time.
 */
export function usePaymentOptions({
  orderNumber,
  currency,
  preferredGateway,
}: {
  orderNumber?: string;
  currency?: Currency;
  preferredGateway?: Gateway | null;
}) {
  const [requestedCharge, setRequestedCharge] = useState<Currency | null>(null);
  const [gateway, setGateway] = useState<Gateway | "">(
    preferredGateway ?? "",
  );
  const [result, setResult] = useState<OptionsResult | null>(null);

  const requestKey = `${orderNumber ?? ""}|${currency ?? ""}|${requestedCharge ?? ""}`;
  const loading = result?.key !== requestKey;
  const options = result?.options ?? null;
  const error = result?.key === requestKey ? result.error : null;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (orderNumber) params.set("order", orderNumber);
    else if (currency) params.set("currency", currency);
    if (requestedCharge) params.set("charge", requestedCharge);

    fetch(`/api/payments/available?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Payment options unavailable.");
        return (await res.json()) as PaymentOptions;
      })
      .then((data) => {
        setResult({ key: requestKey, options: data, error: null });
        setGateway((current) =>
          data.gateways.some((option) => option.id === current)
            ? current
            : (data.gateways[0]?.id ?? ""),
        );
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        setResult({
          key: requestKey,
          options: null,
          error: "We couldn't load payment methods. Refresh and try again.",
        });
        setGateway("");
      });

    return () => controller.abort();
  }, [requestKey, orderNumber, currency, requestedCharge]);

  return {
    options,
    gateway,
    setGateway,
    selectCharge: (next: Currency) => setRequestedCharge(next),
    loading,
    error,
  };
}
