import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, TAGLINE } from "@/lib/tagline";

/**
 * Homepage hero — the one bold moment (DESIGN.md §5). Editorial concept:
 * the client's photograph runs crisp and full-bleed under a left-weighted
 * navy scrim; the brand name sits large and left in stacked display type,
 * so the type anchors the left half while the ring holds the right. No
 * panel, no box — type on image.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--hero-scrim)]">
      <Image
        src="/hero/hero-background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-[72%_50%] md:object-center"
      />
      <div aria-hidden="true" className="hero-scrim absolute inset-0 -z-10" />

      <div className="page-width relative flex min-h-[540px] items-center py-16 md:min-h-[640px] md:py-24">
        <div className="hero-enter max-w-2xl">
          <h1 className="hero-display font-sans font-semibold text-white">
            {BRAND_NAME.split(" ").map((word) => (
              <span key={word} className="block">
                {word}
              </span>
            ))}
          </h1>
          <p className="mt-4 text-subheading text-accent">Fine jewelry</p>
          <p className="mt-6 max-w-sm text-body-lg text-white/85">
            {TAGLINE}
          </p>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center rounded-pill bg-accent px-8 text-body-lg font-medium text-accent-contrast shadow-gold-glow transition-transform duration-fast hover:scale-[1.03]"
            >
              Shop rings
            </Link>
            <Link
              href="/shop?availability=pre_order"
              className="text-body-lg font-medium text-white underline-offset-4 hover:underline"
            >
              See the pre-order collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
