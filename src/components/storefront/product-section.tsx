import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { ProductSummary } from "@/lib/products";

/** Section header — DESIGN.md §7.9. Left-aligned serif heading, quiet chevron. */
export function SectionHeader({
  title,
  href,
  linkLabel = "See all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4">
      <h2 className="font-display text-heading-lg text-warm-ink md:text-heading-lg">
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-1 text-body font-medium text-deep-gold hover:underline"
        >
          {linkLabel}
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: ProductSummary[];
  priorityCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
