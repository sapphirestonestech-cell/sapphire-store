import Image from "next/image";

/**
 * Brand lockup (client-supplied artwork, 2026-11-06 — DECISIONS.md).
 * Transparent PNGs derived from `public/brand/image.png`; the square mark is
 * the drawn monogram in `public/brand/s-monogram.svg`.
 *
 * The artwork is navy + gold, so it needs the ivory plate on dark surfaces:
 * `plate="dark"` applies it only under `[data-theme="dark"]`, `plate="always"`
 * for fixed-dark bands like the footer. Sizing comes from the `className`
 * height; the plate styling lives in globals.css (`.brand-logo--plate-*`).
 *
 * `compact` swaps the wordmark for the monogram below `sm`, where the header
 * has no room for a 200px lockup next to the currency, cart and menu buttons.
 */
const SOURCES = {
  wordmark: {
    src: "/brand/logo-wordmark.png",
    width: 1380,
    height: 165,
    alt: "Sapphire Stones",
  },
  full: {
    src: "/brand/logo-full.png",
    width: 1380,
    height: 256,
    alt: "Sapphire Stones — fine jewelry",
  },
  mark: {
    src: "/brand/s-monogram.svg",
    width: 100,
    height: 100,
    alt: "Sapphire Stones",
  },
} as const;

type Variant = keyof typeof SOURCES;

export function Logo({
  variant = "wordmark",
  plate = "dark",
  compact = false,
  priority = false,
  className,
}: {
  variant?: Variant;
  plate?: "dark" | "always" | "never";
  compact?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const base = ["brand-logo inline-flex items-center leading-none", `brand-logo--plate-${plate}`];

  const lockup = (v: Variant, extra?: string) => {
    const s = SOURCES[v];
    return (
      <span className={[...base, extra, className].filter(Boolean).join(" ")}>
        <Image
          src={s.src}
          alt={s.alt}
          width={s.width}
          height={s.height}
          priority={priority}
          unoptimized={s.src.endsWith(".svg")}
          className="h-full w-auto"
        />
      </span>
    );
  };

  if (!compact) return lockup(variant);

  return (
    <>
      {lockup("mark", "sm:hidden")}
      {lockup(variant, "max-sm:hidden")}
    </>
  );
}
