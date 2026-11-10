import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, TAGLINE } from "@/lib/tagline";

/**
 * Homepage hero — the one bold moment (DESIGN.md §5). The client's
 * photograph stays legible under a light navy wash and a gentle blur; the
 * copy rides a frosted-glass panel, so the type is always readable while
 * the ring and gold bokeh keep their sparkle around it. Centred at every
 * size; the calls to action stack on phones.
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
        className="-z-10 scale-[1.04] object-cover object-[72%_50%] blur-[2px] md:object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[var(--hero-scrim)]/35"
      />

      <div className="page-width relative flex min-h-[540px] items-center justify-center py-16 md:min-h-[600px] md:py-24">
        <div className="hero-enter w-full max-w-xl rounded-md bg-[var(--hero-scrim)]/60 px-6 py-10 text-center shadow-float ring-1 ring-accent/40 backdrop-blur-md md:px-12 md:py-14">
          <h1 className="font-sans text-display font-semibold text-white">
            {BRAND_NAME}
          </h1>
          <p className="mt-1 text-body-lg text-accent">Fine jewelry</p>
          <p className="mx-auto mt-6 max-w-md text-body-lg text-white/90">
            {TAGLINE}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-x-6 sm:gap-y-3">
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
