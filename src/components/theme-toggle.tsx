"use client";

import { useTheme } from "@/components/theme-provider";

/**
 * Theme toggle (DESIGN.md §10). Flips between light and dark and remembers
 * the choice. `variant="icon"` (default) is the compact bordered icon button
 * used in the storefront header; `variant="row"` is a full-width sidebar row
 * (icon + label) used in the admin sidebar footer. The icon and visible label
 * show the theme you would switch TO, which is the common convention, and the
 * accessible name states the action.
 */
export function ThemeToggle({
  className = "",
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "row";
}) {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? "Switch to dark theme" : "Switch to light theme";

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={label}
        title={label}
        className={`flex min-h-12 w-full items-center gap-3 rounded-sm px-3 text-muted transition-colors duration-fast hover:bg-app hover:text-primary ${className}`}
      >
        <span aria-hidden="true" className="shrink-0">
          {next === "dark" ? <MoonIcon size="size-6" /> : <SunIcon size="size-6" />}
        </span>
        <span className="hidden text-body font-medium md:inline">
          {next === "dark" ? "Dark theme" : "Light theme"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={`inline-flex size-9 items-center justify-center rounded-sm border border-border-subtle bg-card text-secondary transition-colors duration-fast hover:bg-raised hover:text-primary ${className}`}
    >
      <span aria-hidden="true" className="text-[20px] leading-none">
        {next === "dark" ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}

function SunIcon({ size = "size-5" }: { size?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={size}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ size = "size-5" }: { size?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={size}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
