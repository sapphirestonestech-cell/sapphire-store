/**
 * Site-wide canvas grain — an irregular, cloud-like noise texture
 * (feTurbulence) in warm ink at low opacity. Rendered once in the root
 * layout so every page (storefront, account, auth, admin) shares one
 * continuous surface.
 *
 * Replaced the regular gold lattice on the client's request (2026-10-18),
 * which read as a repeating grid and competed with the content. By the
 * client's request (2026-10-19) it is now stronger and appears on every
 * page. It must stay irregular — never a repeating grid — and must never
 * compete with content or the gold accents (DESIGN.md §4.6).
 */
export function PatternBackground() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.16]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="canvas-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="4"
          stitchTiles="stitch"
          seed="7"
        />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.129
                  0 0 0 0 0.114
                  0 0 0 0 0.098
                  0 0 0 1 0"
        />
        <feComponentTransfer>
          <feFuncA type="linear" slope="2.2" intercept="-0.6" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter="url(#canvas-grain)" />
    </svg>
  );
}
