import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Hero } from "@/components/storefront/hero";
import { WhyUs } from "@/components/storefront/category-pills";
import {
  BrowseChips,
  BrowseSidebar,
  type BrowseFilters,
} from "@/components/storefront/browse-sidebar";
import { BudgetFilter } from "@/components/storefront/budget-filter";
import {
  ProductGrid,
  SectionHeader,
} from "@/components/storefront/product-section";
import { GridSkeleton } from "@/components/ui/skeleton";
import { connectDb } from "@/lib/db";
import { CategoryModel } from "@/lib/models/category";
import {
  priceBounds,
  queryProducts,
  type ProductSummary,
} from "@/lib/products";
import { shopHeadingFor } from "@/lib/shop-heading";
import type { ShopParams } from "@/components/storefront/shop-explorer";

export const metadata = {
  title: "Luxurious rings at an affordable price",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

async function loadCategories() {
  try {
    await connection();
    await connectDb();
    const cats = await CategoryModel.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();
    return cats.map((c) => ({ slug: c.slug, name: c.name }));
  } catch {
    return [];
  }
}

async function loadFeatured(): Promise<ProductSummary[]> {
  try {
    await connection();
    const { products } = await queryProducts({}, { limit: 8 });
    const featured = products.filter((p) => p.isFeatured);
    return (featured.length > 0 ? featured : products).slice(0, 4);
  } catch {
    return [];
  }
}

function EmptyCatalogNotice() {
  return (
    <div className="rounded-md bg-card p-10 text-center shadow-card">
      <p className="mx-auto max-w-sm text-body-lg text-muted">
        The collection is being prepared. Add rings from the admin dashboard to
        see them here.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex min-h-11 items-center rounded-pill border border-border-subtle bg-card px-6 text-body font-medium text-primary"
      >
        Open admin
      </Link>
    </div>
  );
}

/** Filtered-to-empty state — DESIGN.md §7.23. */
function FilterEmpty() {
  return (
    <div className="rounded-md bg-card p-10 text-center shadow-card">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="mx-auto mb-4 size-4 text-accent"
        fill="currentColor"
      >
        <path d="M8 0l1.8 6.2L16 8l-6.2 1.8L8 16l-1.8-6.2L0 8l6.2-1.8L8 0z" />
      </svg>
      <p className="mx-auto max-w-sm text-body-lg text-muted">
        No rings match these filters. Clear filters to see all rings.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-pill border border-border-subtle bg-card px-6 text-body font-medium text-primary"
      >
        Clear filters
      </Link>
    </div>
  );
}

function BrowseError() {
  return (
    <div
      role="alert"
      className="rounded-md bg-card p-10 text-center shadow-card"
    >
      <p className="text-body-lg text-muted">
        We couldn&apos;t load the collection right now. Refresh the page to try
        again.
      </p>
    </div>
  );
}

function seeAllHref(params: ShopParams): string {
  const sp = new URLSearchParams();
  if (params.availability) sp.set("availability", params.availability);
  if (params.category) sp.set("category", params.category);
  if (params.min) sp.set("min", params.min);
  if (params.max) sp.set("max", params.max);
  const qs = sp.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const featuredPromise = loadFeatured();

  return (
    <>
      <Suspense
        fallback={
          <div className="page-width py-20">
            <div className="mx-auto h-12 w-2/3 animate-pulse rounded bg-border-default/60" />
          </div>
        }
      >
        <HeroSlot featuredPromise={featuredPromise} />
      </Suspense>

      <Suspense
        fallback={
          <div className="page-width pb-16 md:pb-20">
            <div className="mb-6 h-8 w-48 animate-pulse rounded bg-border-default/60" />
            <GridSkeleton count={6} />
          </div>
        }
      >
        <BrowseSlot searchParams={searchParams} />
      </Suspense>

      <WhyUs />
      <div className="h-16 md:h-20" />
    </>
  );
}

async function HeroSlot({
  featuredPromise,
}: {
  featuredPromise: Promise<ProductSummary[]>;
}) {
  const featured = await featuredPromise;
  return <Hero featured={featured} />;
}

async function lookupCategoryName(slug: string): Promise<string | null> {
  try {
    await connectDb();
    const cat = await CategoryModel.findOne({ slug }).lean();
    return cat?.name ?? null;
  } catch {
    return null;
  }
}

async function BrowseSlot({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const params: ShopParams = {
    category: first(sp.category),
    availability: first(sp.availability),
    min: first(sp.min),
    max: first(sp.max),
  };
  const filters: BrowseFilters = {
    availability: params.availability,
    category: params.category,
    min: params.min,
    max: params.max,
  };
  const hasFilters = Boolean(
    filters.availability || filters.category || filters.min || filters.max,
  );

  let result: { products: ProductSummary[]; total: number } | null = null;
  let categories: { slug: string; name: string }[] = [];
  let bounds: { min: number; max: number } | null = null;
  let failed = false;
  try {
    await connection();
    const [res, cats, b] = await Promise.all([
      queryProducts(params, { limit: 24 }),
      loadCategories(),
      priceBounds().catch(() => null),
    ]);
    result = res;
    categories = cats;
    bounds = b;
  } catch {
    failed = true;
  }

  if (failed || !result) {
    return (
      <div className="page-width pb-16 md:pb-20">
        <BrowseError />
      </div>
    );
  }

  let heading = shopHeadingFor(params);
  if (params.category) {
    heading = (await lookupCategoryName(params.category)) ?? heading;
  }

  return (
    <section
      aria-labelledby="browse-heading"
      className="page-width pb-16 md:pb-20"
    >
      <SectionHeader
        title={heading}
        meta={`${result.total} ${result.total === 1 ? "ring" : "rings"}`}
        href={seeAllHref(params)}
      />
      <h2 id="browse-heading" className="sr-only">
        {heading}
      </h2>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        {/* Mobile: quick chips and budget above the grid */}
        <div className="space-y-4 lg:hidden">
          <BrowseChips categories={categories} active={filters} />
          {bounds ? (
            <div className="rounded-md bg-card/90 p-4 shadow-card">
              <BudgetFilter
                minBound={bounds.min}
                maxBound={bounds.max}
                valueMin={filters.min ? Number(filters.min) : undefined}
                valueMax={filters.max ? Number(filters.max) : undefined}
                availability={filters.availability}
                category={filters.category}
              />
            </div>
          ) : null}
        </div>

        {/* Desktop: grouped sidebar */}
        <div className="hidden lg:block">
          <BrowseSidebar
            categories={categories}
            active={filters}
            priceBounds={bounds}
          />
        </div>

        {/* Grid */}
        <div className="min-w-0">
          {result.total === 0 ? (
            hasFilters ? (
              <FilterEmpty />
            ) : (
              <EmptyCatalogNotice />
            )
          ) : (
            <ProductGrid
              products={result.products}
              priorityCount={4}
                gridClassName="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"

            />
          )}
        </div>
      </div>
    </section>
  );
}
