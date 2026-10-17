"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_USD_TO_NGN,
  type Currency,
} from "@/lib/currency";

const STORAGE_KEY = "sapphire_currency";

/**
 * Saved-currency store. Read through useSyncExternalStore so the browser
 * value is applied without a synchronous setState inside an effect, and
 * stays stable across hydration (the server snapshot is always USD).
 */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function readStored(): Currency {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "NGN" || saved === "USD" ? saved : "USD";
  } catch {
    return "USD";
  }
}

function getSnapshot(): Currency {
  return readStored();
}

function getServerSnapshot(): Currency {
  return "USD";
}

function persist(c: Currency) {
  try {
    window.localStorage.setItem(STORAGE_KEY, c);
  } catch {
    /* storage blocked — choice not remembered */
  }
  listeners.forEach((cb) => cb());
}

interface CurrencyContextValue {
  currency: Currency;
  usdToNgn: number;
  baseCurrency: Currency;
  setCurrency: (c: Currency) => void;
  /** Bumps on every switch so prices can crossfade (DESIGN.md §7.3). */
  switchCount: number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

interface CurrencyContextResponse {
  usdToNgn: number;
  baseCurrency: Currency;
}

/**
 * Active display currency. Server renders at the USD default; the real
 * rate and base currency arrive from GET /currency/context (§13.1).
 * Geolocation-driven default currency is a Phase 2 stub (§7.3); a saved
 * manual choice always overrides.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [manual, setManual] = useState<Currency | null>(null);
  const [ctx, setCtx] = useState<CurrencyContextResponse>({
    usdToNgn: DEFAULT_USD_TO_NGN,
    baseCurrency: "USD",
  });
  const [switchCount, setSwitchCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/currency/context")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CurrencyContextResponse | null) => {
        if (!cancelled && data) setCtx(data);
      })
      .catch(() => {
        /* keep defaults; prices stay viewable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = manual ?? stored;

  const setCurrency = useCallback(
    (c: Currency) => {
      if (currency !== c) setSwitchCount((n) => n + 1);
      persist(c);
      setManual(c);
    },
    [currency],
  );

  const value = useMemo(
    () => ({
      currency,
      usdToNgn: ctx.usdToNgn,
      baseCurrency: ctx.baseCurrency,
      setCurrency,
      switchCount,
    }),
    [currency, ctx, setCurrency, switchCount],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used inside CurrencyProvider.");
  }
  return ctx;
}
