import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { Gallery } from "@/components/storefront/gallery";
import { PurchasePanel } from "@/components/storefront/purchase-panel";
import { DeliveryEstimator } from "@/components/storefront/delivery-estimator";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { Price } from "@/components/price";
import { ProductGrid, SectionHeader } from "@/components/storefront/product-section";
import { connectDb } from "@/lib/db";
import { ProductModel, type ProductDoc } from "@/lib/models/product";
import { CategoryModel } from "@/lib/models/category";
import { queryProducts, toSummary, type ProductSummary } from "@/lib/products";
import { getDeliveryLocations } from "@/lib/settings";
import { formatArrivalLong } from "@/lib/format";
import { TAGLINE } from "@/lib/tagline";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadProduct(slug: string): Promise<ProductDoc | null> {
  try {
    await connectDb();
    const doc = await ProductModel.findOne({ slug, status: "published" })
      .populate("categories", "slug name")
      .lean();
    return doc ? (doc as unknown as ProductDoc) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const product = await loadProduct(slug);
  if (!product) return { title: "Ring not found" };
  return {
    title: product.seoTitle ?? product.name,
    description:
      product.seoDescription ??
      `${TAGLINE} ${product.name} — ${product.material}, ${product.shape}.`,
  };
}

async function relatedRings(product: ProductDoc): Promise<ProductSummary[]> {
  try {
    const categoryId = product.categories[0];
    if (!categoryId) return [];
    const cat = await CategoryModel.findById(categoryId).lean();
    if (!cat) return [];
    const { products } = await queryProducts(
      { category: cat.slug },
      { limit: 4 },
    );
    return products.filter((p) => p.slug !== product.slug).slice(0, 4);
  } catch {
    return [];
  }
}

export default function ProductDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="page-width grid animate-pulse gap-10 py-8 md:grid-cols-2 md:gap-12 md:py-12">
      <div className="aspect-square rounded-card bg-pale-sand" />
      <div className="space-y-4">
        <div className="h-8 w-2/3 rounded-pill bg-pale-sand" />
        <div className="h-6 w-1/4 rounded-pill bg-pale-sand" />
        <div className="h-12 w-full rounded-pill bg-pale-sand" />
        <div className="h-40 w-full rounded-card bg-pale-sand" />
      </div>
    </div>
  );
}

async function ProductDetail({ params }: PageProps) {
  const { slug } = await params;
  await connection();
  const product = await loadProduct(slug);
  if (!product) notFound();

  const summary = toSummary(product);
  const soldOut =
    summary.availability === "in_stock" &&
    summary.sizes.length > 0 &&
    summary.sizes.every((s) => s.stockQuantity === 0);
  const isPreorder = summary.availability === "pre_order";
  const arrivalLong = isPreorder
    ? formatArrivalLong(summary.preorderArrivalDate ?? "")
    : null;

  const [locations, related] = await Promise.all([
    getDeliveryLocations(),
    relatedRings(product),
  ]);

  const categoryNames = product.categories
    .map((c) => (c as unknown as { name?: string }).name)
    .filter(Boolean) as string[];

  const freeDeliveryLabels = summary.freeDelivery.allLocations
    ? []
    : locations
        .filter((l) => summary.freeDelivery.locationIds.includes(l.id))
        .map((l) => l.label);

  return (
    <div className="page-width pb-32 pt-8 md:pb-24 md:pt-12">
      <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-8">
        {/* Gallery */}
        <div className="md:sticky md:top-28 md:self-start">
          <Gallery images={summary.images} productName={product.name} />
        </div>

        {/* Purchase panel */}
        <div className="space-y-4">
          <div className="space-y-3">
            <h1 className="font-display text-heading-lg text-warm-ink md:text-heading-lg">
              {product.name}
            </h1>
            {categoryNames.length > 0 ? (
              <p className="text-body text-soft-taupe">
                {categoryNames.join(" · ")}
              </p>
            ) : null}
          </div>

          {/* Price block — DESIGN.md §7.11, with the availability badge beside it */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Price
              amount={product.basePrice}
              className="text-heading font-semibold"
            />
            {product.compareAtPrice ? (
              <Price
                amount={product.compareAtPrice}
                className="text-body text-soft-taupe line-through"
              />
            ) : null}
            <AvailabilityBadge
              availability={summary.availability}
              arrivalDate={summary.preorderArrivalDate}
              soldOut={soldOut}
            />
          </div>

          {isPreorder && arrivalLong ? (
            <p className="text-body text-deep-gold">
              Arriving {arrivalLong} — shipping time is added after arrival.
            </p>
          ) : null}

          {/* Description sits directly under the price (client instruction,
              2026-10-19) so the story reads before the buying controls. */}
          {product.description ? (
            <p className="max-w-prose whitespace-pre-line text-body-lg text-soft-taupe">
              {product.description}
            </p>
          ) : null}

          <div id="buy" className="scroll-mt-28">
            <PurchasePanel
              productId={summary.id}
              slug={summary.slug}
              name={summary.name}
              basePrice={summary.basePrice}
              availability={summary.availability}
              preorderArrivalDate={summary.preorderArrivalDate}
              paymentMode={summary.paymentMode}
              depositPercent={summary.depositPercent}
              freeDelivery={summary.freeDelivery}
              sizes={summary.sizes}
              imageUrl={summary.coverImage?.url ?? null}
              preorderMaxQty={summary.preorderMaxQty}
              freeDeliveryLabels={freeDeliveryLabels}
            />
          </div>

          <DeliveryEstimator
            locations={locations}
            productId={summary.id}
            availability={summary.availability}
            arrivalDate={summary.preorderArrivalDate}
          />

          {/* Specifications — §5.3. Plain two-column list, no card (client
              instruction, 2026-10-19): the white card read as one more heavy
              block between the buying controls and the page content. */}
          <section aria-labelledby="specs-heading" className="pt-2">
            <h2 id="specs-heading" className="mb-3 text-subheading font-semibold">
              Details
            </h2>
            <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
              {[
                ["Type", product.type],
                ["Category", categoryNames.join(", ") || "—"],
                ["Shape", product.shape],
                [
                  "Size",
                  summary.sizes.map((s) => s.sizeLabel).join(", ") || "—",
                ],
                ["Material", product.material],
                ["Color", product.color],
              ].map(([term, value]) => (
                <div
                  key={term}
                  className="flex justify-between gap-4 border-b border-hairline py-2.5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <dt className="text-body text-soft-taupe">{term}</dt>
                  <dd className="text-body font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="rounded-card bg-gold-wash/60 p-5">
            <p className="text-body text-warm-ink">{TAGLINE}</p>
            <p className="mt-1 text-body text-soft-taupe">
              Secure payment · Clear delivery costs · Pre-order welcome
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-20 md:mt-28">
          <SectionHeader title="You may also like" href="/shop" linkLabel="All rings" />
          <h2 id="related-heading" className="sr-only">
            Related rings
          </h2>
          <ProductGrid products={related} />
        </section>
      ) : null}

      {/* Sticky bottom bar — mobile (DESIGN.md §8.3) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-pure-white px-4 py-3 shadow-float md:hidden">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-body text-soft-taupe">{product.name}</p>
            <Price
              amount={product.basePrice}
              className="text-body-lg font-semibold"
            />
          </div>
          <a
            href="#buy"
            className="inline-flex min-h-12 shrink-0 items-center rounded-pill bg-champagne-gold px-6 text-body-lg font-medium text-warm-ink shadow-gold-glow"
          >
            Add to cart
          </a>
        </div>
      </div>
    </div>
  );
}
