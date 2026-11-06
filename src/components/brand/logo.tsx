import Image from "next/image";

/**
 * Brand lockup (client-supplied artwork, 2026-11-06 — DECISIONS.md).
 * Transparent PNGs derived from `public/brand/image.png`.
 *
 * The artwork is navy + gold, so it needs the ivory plate on dark surfaces:
 * `plate="dark"` applies it only under `[data-theme="dark"]`, `plate="always"`
 * for fixed-dark bands like the footer. Sizing comes from the `className`
 * height; the plate styling lives in globals.css (`.brand-logo--plate-*`).
 *
 * The wordmark is used at every width — the client asked for the logo image
 * on mobile too, so the header sizes it down rather than swapping to the
 * square mark.
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
} as const;

export function Logo({
  variant = "wordmark",
  plate = "dark",
  priority = false,
  className,
}: {
  variant?: keyof typeof SOURCES;
  plate?: "dark" | "always" | "never";
  priority?: boolean;
  className?: string;
}) {
  const s = SOURCES[variant];
  return (
    <span
      className={[
        "brand-logo inline-flex items-center leading-none",
        `brand-logo--plate-${plate}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src={s.src}
        alt={s.alt}
        width={s.width}
        height={s.height}
        priority={priority}
        className="h-full w-auto"
      />
    </span>
  );
}
