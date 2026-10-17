import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Hero } from "@/components/storefront/hero";
import { CategoryPills, WhyUs } from "@/components/storefront/category-pills";
import {
  ProductGrid,
  SectionHeader,
} from "@/components/storefront/product-section";
import { GridSkeleton } from "@/components/ui/skeleton";
import { RingPlaceholder } from "@/components/ui/ring-placeholder";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { Price } from "@/components/price";
import { connectDb } from "@/lib/db";
import { CategoryModel } from "@/lib/models/category";
import { queryProducts, type ProductSummary } from "@/lib/products";

export const metadata = {
  title: "Luxurious rings at an affordable price",
};

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

async function loadNewArrivals(): Promise<ProductSummary[]> {
  try {
    await connection();
    const { products } = await queryProducts({}, { limit: 8, });
    return products;
  } catch {
    return [];
  }
}

async function loadPreOrders(): Promise<ProductSummary[]> {
  try {
    await connection();
    const { products } = await queryProducts(
      { availability: "pre_order", sort: "newest" },
      { limit: 4 },
    );
    return products;
  } catch {
    return [];
  }
}

function EmptyCatalogNotice() {
  return (
    <div className="rounded-card bg-pure-white p-10 text-center shadow-card">
      <p className="mx-auto max-w-sm text-body-lg text-soft-taupe">
        The collection is being prepared. Add rings from the admin dashboard to
        see them here.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex min-h-11 items-center rounded-pill border border-hairline bg-pure-white px-6 text-body font-medium text-warm-ink"
      >
        Open admin
      </Link>
    </div>
  );
}

async function PreorderBand() {
  const items = await loadPreOrders();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="preorder-heading" className="page-width">
      <SectionHeader
        title="Coming soon"
        href="/shop?availability=pre_order"
        linkLabel="Pre-order collection"
      />
      <h2 id="preorder-heading" className="sr-only">
        Pre-order highlight
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            className="group rounded-card bg-pure-white p-2 shadow-card transition-shadow duration-fast hover:shadow-float"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-image">
              {p.coverImage && !p.coverImage.url.startsWith("placeholder:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.coverImage.url}
                  alt={p.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-base group-hover:scale-[1.03]"
                />
              ) : (
                <RingPlaceholder label={p.name} />
              )}
            </div>
            <div className="space-y-1.5 px-2 pb-2 pt-3">
              <h3 className="text-body font-medium">{p.name}</h3>
              <p className="text-body-lg font-semibold">
                <Price amount={p.basePrice} />
              </p>
              <AvailabilityBadge
                availability="pre_order"
                arrivalDate={p.preorderArrivalDate}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function NewArrivalsSection() {
  const items = await loadNewArrivals();
  if (items.length === 0) return <EmptyCatalogNotice />;
  return (
    <section aria-labelledby="new-arrivals-heading" className="page-width">
      <SectionHeader title="New arrivals" href="/shop?sort=newest" />
      <h2 id="new-arrivals-heading" className="sr-only">
        New arrivals
      </h2>
      <ProductGrid products={items} />
    </section>
  );
}

export default function HomePage() {
  const featuredPromise = loadFeatured();
  const categoriesPromise = loadCategories();

  return (
    <>
      <Suspense
        fallback={
          <div className="page-width py-20">
            <div className="mx-auto h-12 w-2/3 animate-pulse rounded bg-pale-sand/60" />
          </div>
        }
      >
        <HeroSlot featuredPromise={featuredPromise} categoriesPromise={categoriesPromise} />
      </Suspense>

      <Suspense fallback={<GridSkeleton count={4} />}>
        <NewArrivalsSection />
      </Suspense>

      <Suspense fallback={null}>
        <PreorderBand />
      </Suspense>

      <Suspense fallback={null}>
        <CategoryTilesSection categoriesPromise={categoriesPromise} />
      </Suspense>

      <WhyUs />
      <div className="h-16 md:h-20" />
    </>
  );
}

async function HeroSlot({
  featuredPromise,
  categoriesPromise,
}: {
  featuredPromise: Promise<ProductSummary[]>;
  categoriesPromise: Promise<{ slug: string; name: string }[]>;
}) {
  const [featured, categories] = await Promise.all([
    featuredPromise,
    categoriesPromise,
  ]);
  return (
    <>
      <Hero featured={featured} />
      <div className="page-width pb-16 md:pb-20">
        <CategoryPills categories={categories} />
      </div>
    </>
  );
}

async function CategoryTilesSection({
  categoriesPromise,
}: {
  categoriesPromise: Promise<{ slug: string; name: string }[]>;
}) {
  const categories = await categoriesPromise;
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="categories-heading" className="page-width">
      <SectionHeader
        title="Shop by category"
        href="/shop"
        linkLabel="All rings"
      />
      <h2 id="categories-heading" className="sr-only">
        Shop by category
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            className="group flex min-h-32 flex-col justify-end rounded-card bg-pure-white p-6 shadow-card transition-shadow duration-fast hover:shadow-float"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="mb-3 size-5 text-champagne-gold"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <circle cx="8" cy="9.5" r="4.5" />
              <path d="M8 2l2 2.5L8 7 6 4.5 8 2z" />
            </svg>
            <span className="font-display text-heading text-warm-ink">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
