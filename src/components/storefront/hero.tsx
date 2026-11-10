import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, TAGLINE } from "@/lib/tagline";

/**
 * Homepage hero — the one bold moment (DESIGN.md §5). Editorial type-on-image:
 * the client's photograph runs crisp under a left-weighted navy scrim, and the
 * business name is a display lockup — "Sapphire Stones" on one line with
 * "Fine jewelry" beneath it in gold (it is part of the name, not a caption).
 * The name is sized in viewport units so it always fits on a single line.
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
        <div className="hero-enter w-full max-w-4xl">
          <h1 className="font-sans font-semibold text-white">
            <span className="hero-display block">{BRAND_NAME}</span>
            <span className="hero-descriptor block text-accent">
              Fine jewelry
            </span>
          </h1>
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
