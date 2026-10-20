import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { ProductSummary } from "@/lib/products";

/** Section header — DESIGN.md §7.9. Left-aligned serif heading, quiet chevron. */
export function SectionHeader({
  title,
  href,
  linkLabel = "See all",
  meta,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  /** Quiet secondary text beside the heading (e.g. result count). */
  meta?: string;
}) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="font-sans text-heading-lg text-primary md:text-heading-lg">
          {title}
        </h2>
        {meta ? (
          <span className="text-body text-muted">{meta}</span>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 text-body font-medium text-accent-strong hover:underline"
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
  gridClassName,
}: {
  products: ProductSummary[];
  priorityCount?: number;
  /** Override the default 2/3/4-column grid (e.g. narrower beside a sidebar). */
  gridClassName?: string;
}) {
  return (
    <div
      className={
        gridClassName ??
        "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
      }
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
