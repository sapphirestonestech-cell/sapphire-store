"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "sapphire_theme";

/**
 * Theme store (DESIGN.md §10). A saved choice is read from localStorage and
 * applied to `<html data-theme>`; with nothing saved the store defaults to
 * light (client instruction, 2026-10-21 — no longer follows the OS preference).
 *
 * Read through useSyncExternalStore like the currency provider, so the
 * browser value is applied without a synchronous setState in an effect and
 * stays stable across hydration (the server snapshot is always `null`,
 * meaning "no explicit choice").
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

function readStored(): Theme | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function getSnapshot(): Theme | null {
  return readStored();
}

function getServerSnapshot(): Theme | null {
  return null;
}

/** The theme actually in effect: a saved choice, else light. */
function resolve(choice: Theme | null): Theme {
  return choice ?? "light";
}

function apply(theme: Theme | null) {
  const root = document.documentElement;
  if (theme) {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }
}

function persist(theme: Theme | null) {
  try {
    if (theme) window.localStorage.setItem(STORAGE_KEY, theme);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked — choice not remembered */
  }
  listeners.forEach((cb) => cb());
}

interface ThemeContextValue {
  /** The theme in effect right now. */
  theme: Theme;
  /** The visitor's explicit choice, or null for the light default. */
  choice: Theme | null;
  setTheme: (theme: Theme) => void;
  /** Clear the explicit choice and return to the light default. */
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const choice = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const theme = resolve(choice);

  useEffect(() => {
    apply(choice);
  }, [choice]);

  const setTheme = useCallback((next: Theme) => {
    persist(next);
  }, []);

  const reset = useCallback(() => {
    persist(null);
  }, []);

  const value = useMemo(
    () => ({ theme, choice, setTheme, reset }),
    [theme, choice, setTheme, reset],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
