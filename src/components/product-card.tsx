import Link from "next/link";
import { Price } from "@/components/price";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { RingPlaceholder } from "@/components/ui/ring-placeholder";
import type { ProductSummary } from "@/lib/products";

const PLACEHOLDER_PREFIX = "placeholder:";

function isPlaceholder(url: string): boolean {
  return url.startsWith(PLACEHOLDER_PREFIX);
}

/**
 * Product card — DESIGN.md §7.6. White surface, 28px radius, card shadow,
 * no border, 4:5 cover with 20px inner radius. Second image fades in on
 * desktop hover.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const cover = product.coverImage;
  const second = product.images[1];
  const soldOut =
    product.availability === "in_stock" &&
    product.sizes.length > 0 &&
    product.sizes.every((s) => s.stockQuantity === 0);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-card bg-pure-white shadow-card transition-shadow duration-fast hover:shadow-float"
    >
      <div className="relative m-2 overflow-hidden rounded-image">
        <div className="aspect-[4/5.5]">
          {cover && !isPlaceholder(cover.url) ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary CDN URLs are optimized at upload time in Phase 1
            <img
              src={cover.url}
              alt={`${cover.label ?? "Product"} — ${product.name}`}
              width={480}
              height={600}
              loading={priority ? "eager" : "lazy"}
              className="size-full object-cover transition-transform duration-base group-hover:scale-[1.03]"
            />
          ) : (
            <RingPlaceholder label={product.name} />
          )}
        </div>
        {second && !isPlaceholder(second.url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={second.url}
            alt={`${second.label ?? "Alternate view"} — ${product.name}`}
            width={480}
            height={600}
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-base group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        ) : null}
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-chip-label bg-pure-white/90 px-2 py-1 text-label font-medium text-warm-ink">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5 px-4 pb-4 pt-2">
        <h3 className="text-body font-medium">{product.name}</h3>
        <p className="text-body-lg font-semibold">
          <Price amount={product.basePrice} />
          {product.compareAtPrice ? (
            <span className="ml-2 text-body font-normal text-soft-taupe line-through">
              <Price amount={product.compareAtPrice} />
            </span>
          ) : null}
        </p>
        <AvailabilityBadge
          availability={product.availability}
          arrivalDate={product.preorderArrivalDate}
          soldOut={soldOut}
        />
      </div>
    </Link>
  );
}
