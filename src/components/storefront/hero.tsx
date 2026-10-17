import Link from "next/link";
import { RingPlaceholder } from "@/components/ui/ring-placeholder";
import { TAGLINE } from "@/lib/tagline";
import type { ProductSummary } from "@/lib/products";

function ConstellationCard({
  product,
  className,
  delayMs,
}: {
  product: ProductSummary;
  className: string;
  delayMs: number;
}) {
  return (
    <div
      className={`constellation-card absolute w-[190px] rounded-card bg-pure-white p-2 shadow-card ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <Link href={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true">
        <div className="aspect-[4/5] overflow-hidden rounded-image">
          {product.coverImage &&
          !product.coverImage.url.startsWith("placeholder:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.coverImage.url}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <RingPlaceholder label={product.name} />
          )}
        </div>
      </Link>
    </div>
  );
}

/**
 * Homepage hero — DESIGN.md §8.1. The tagline is the serif display
 * headline; the floating constellation of ring cards is the page's one
 * bold moment, drifting in once on load.
 */
export function Hero({ featured }: { featured: ProductSummary[] }) {
  const cards = featured.slice(0, 4);
  const mobileCards = cards.slice(0, 2);

  const desktopSlots = [
    "left-[3%] top-[6%] -rotate-3",
    "right-[4%] top-0 rotate-2",
    "left-[14%] bottom-[6%] rotate-2",
    "right-[16%] bottom-[12%] -rotate-2",
  ];

  return (
    <section className="page-width relative pb-16 pt-10 md:pb-28 md:pt-20">
      {/* Mobile constellation: two quiet cards above the headline */}
      {mobileCards.length > 0 ? (
        <div className="mb-10 flex justify-center gap-4 md:hidden">
          {mobileCards.map((p, i) => (
            <div
              key={p.id}
              className="constellation-card w-[42%] max-w-[170px] rounded-card bg-pure-white p-2 shadow-card"
              style={{ animationDelay: `${(i + 1) * 120}ms` }}
            >
              <Link href={`/product/${p.slug}`} tabIndex={-1} aria-hidden="true">
                <div className="aspect-[4/5] overflow-hidden rounded-image">
                  {p.coverImage &&
                  !p.coverImage.url.startsWith("placeholder:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImage.url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <RingPlaceholder label={p.name} />
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : null}

      {/* Desktop constellation */}
      {cards.length > 0 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mx-auto hidden max-w-[1200px] md:block"
        >
          {cards.map((p, i) => (
            <ConstellationCard
              key={p.id}
              product={p}
              className={desktopSlots[i] ?? "left-1/2 top-4"}
              delayMs={(i + 1) * 120}
            />
          ))}
        </div>
      ) : null}

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h1 className="font-display text-display text-warm-ink">{TAGLINE}</h1>
        <p className="mx-auto mt-5 max-w-md text-body-lg text-soft-taupe">
          Get affordable yet luxurious rings — ready to ship or available to
          pre-order, with clear prices in dollars or naira.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow transition-transform duration-fast hover:scale-[1.03]"
        >
          Shop rings
        </Link>
      </div>
    </section>
  );
}
