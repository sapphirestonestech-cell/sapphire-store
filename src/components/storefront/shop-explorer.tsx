"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { CardSkeleton } from "@/components/ui/skeleton";
import type { ProductSummary } from "@/lib/products";

export type ShopParams = {
  category?: string;
  type?: string;
  material?: string;
  color?: string;
  shape?: string;
  size?: string;
  availability?: string;
  min?: string;
  max?: string;
  sort?: string;
  q?: string;
};

const TYPE_OPTIONS = [
  { value: "engagement", label: "Engagement" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "pre_order", label: "Pre-order" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "name-az", label: "Name, A to Z" },
];

function toQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (typeof v === "string" && v) sp.set(k, v);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export interface FacetOptions {
  materials: string[];
  colors: string[];
  shapes: string[];
  sizes: string[];
}

function SelectControl({
  label,
  value,
  options,
  onChange,
  anyLabel,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  anyLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-label font-medium text-soft-taupe">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-pill border border-hairline bg-pure-white px-4 text-body text-warm-ink"
      >
        <option value="">{anyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterPanel({
  params,
  facets,
  onChange,
}: {
  params: ShopParams;
  facets: FacetOptions;
  onChange: (patch: Partial<ShopParams>) => void;
}) {
  return (
    <div className="space-y-5">
      <SelectControl
        label="Type"
        value={params.type ?? ""}
        options={TYPE_OPTIONS}
        onChange={(v) => onChange({ type: v })}
        anyLabel="All types"
      />
      <SelectControl
        label="Availability"
        value={params.availability ?? ""}
        options={AVAILABILITY_OPTIONS}
        onChange={(v) => onChange({ availability: v })}
        anyLabel="Any"
      />
      <SelectControl
        label="Material"
        value={params.material ?? ""}
        options={facets.materials.map((m) => ({ value: m, label: m }))}
        onChange={(v) => onChange({ material: v })}
        anyLabel="Any material"
      />
      <SelectControl
        label="Color"
        value={params.color ?? ""}
        options={facets.colors.map((m) => ({ value: m, label: m }))}
        onChange={(v) => onChange({ color: v })}
        anyLabel="Any color"
      />
      <SelectControl
        label="Shape"
        value={params.shape ?? ""}
        options={facets.shapes.map((m) => ({ value: m, label: m }))}
        onChange={(v) => onChange({ shape: v })}
        anyLabel="Any shape"
      />
      <SelectControl
        label="Size"
        value={params.size ?? ""}
        options={facets.sizes.map((m) => ({ value: m, label: m }))}
        onChange={(v) => onChange({ size: v })}
        anyLabel="Any size"
      />
    </div>
  );
}

const ACTIVE_FILTER_LABELS: Record<string, string> = {
  category: "Category",
  type: "Type",
  material: "Material",
  color: "Color",
  shape: "Shape",
  size: "Size",
  availability: "Availability",
  min: "Min price",
  max: "Max price",
  sort: "Sort",
  q: "Search",
};

/**
 * Shop explorer — URL is the source of truth for filter state (§5.2);
 * results update without a full page reload (US-C2).
 */
export function ShopExplorer({
  initialProducts,
  initialTotal,
  params,
  facets,
  heading,
  tagline,
}: {
  initialProducts: ProductSummary[];
  initialTotal: number;
  params: ShopParams;
  facets: FacetOptions;
  heading: string;
  tagline: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const firstRender = useRef(true);

  const pageSize = 24;

  const applyParams = useCallback(
    (next: ShopParams) => {
      router.replace(`${pathname}${toQuery(next)}`, { scroll: false });
    },
    [router, pathname],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/products${toQuery({ ...params, limit: String(pageSize) })}`)
      .then((r) => {
        if (!r.ok) throw new Error("request failed");
        return r.json() as Promise<{
          products: ProductSummary[];
          total: number;
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) {
          setError("We couldn't load rings with these filters. Clear filters to see the full collection.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  function loadMore() {
    setLoading(true);
    const skip = products.length;
    fetch(
      `/api/products${toQuery({
        ...params,
        limit: String(pageSize),
        skip: String(skip),
      })}`,
    )
      .then((r) => {
        if (!r.ok) throw new Error("request failed");
        return r.json() as Promise<{ products: ProductSummary[] }>;
      })
      .then((data) => {
        setProducts((prev) => [...prev, ...data.products]);
      })
      .catch(() => {
        setError("We couldn't load more rings. Try again shortly.");
      })
      .finally(() => setLoading(false));
  }

  const activeChips = (
    Object.entries(params) as [keyof ShopParams, string | undefined][]
  ).filter(
    ([k, v]) =>
      k !== "sort" && k !== "q" && typeof v === "string" && v.length > 0,
  ) as [keyof ShopParams, string][];

  const hasFilters = activeChips.length > 0;

  return (
    <div className="page-width pb-24 pt-10 md:pt-14">
      {/* Page header — the tagline appears on listing pages too (§1.2) */}
      <div className="mb-8 max-w-xl">
        <h1 className="font-display text-heading-lg text-warm-ink md:text-display">
          {heading}
        </h1>
        <p className="mt-3 text-body-lg text-soft-taupe">{tagline}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-hairline bg-pure-white px-5 text-body font-medium text-warm-ink shadow-soft lg:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M3 5h14M6 10h8M8.5 15h3" strokeLinecap="round" />
          </svg>
          Filters
        </button>
        <label className="ml-auto inline-flex items-center gap-2 text-body text-soft-taupe">
          <span className="hidden sm:inline">Sort</span>
          <select
            value={params.sort ?? "newest"}
            onChange={(e) => applyParams({ ...params, sort: e.target.value })}
            className="h-11 rounded-pill border border-hairline bg-pure-white px-4 text-body text-warm-ink"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-8">
        <aside aria-label="Filters" className="hidden w-56 shrink-0 lg:block">
          <FilterPanel
            params={params}
            facets={facets}
            onChange={(patch) => applyParams({ ...params, ...patch })}
          />
        </aside>

        <div className="min-w-0 flex-1">
          {hasFilters ? (
            <div className="mb-5 flex flex-wrap gap-2">
              {activeChips.map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyParams({ ...params, [key]: undefined })}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-hairline bg-pure-white px-3 py-1 text-label font-medium text-warm-ink"
                >
                  {ACTIVE_FILTER_LABELS[key]}: {value}
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">Remove filter</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyParams({ sort: params.sort })}
                className="inline-flex min-h-9 items-center rounded-pill px-3 py-1 text-label font-medium text-deep-gold underline underline-offset-4"
              >
                Clear filters
              </button>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="mb-5 rounded-card border border-status-error/40 bg-pure-white p-6 shadow-card"
            >
              <p className="text-body text-status-error">{error}</p>
              <button
                type="button"
                onClick={() => applyParams({ sort: params.sort })}
                className="mt-3 inline-flex min-h-11 items-center rounded-pill border border-hairline bg-pure-white px-5 text-body font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : null}

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 && !loading ? (
            <div className="rounded-card bg-pure-white p-10 text-center shadow-card">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="mx-auto mb-4 size-5 text-champagne-gold"
                fill="currentColor"
              >
                <path d="M8 0l1.8 6.2L16 8l-6.2 1.8L8 16l-1.8-6.2L0 8l6.2-1.8L8 0z" />
              </svg>
              <p className="mx-auto max-w-sm text-body-lg text-soft-taupe">
                No rings match these filters. Clear filters to see all rings.
              </p>
              <button
                type="button"
                onClick={() => applyParams({ sort: params.sort })}
                className="mt-6 inline-flex min-h-11 items-center rounded-pill border border-hairline bg-pure-white px-6 text-body font-medium text-warm-ink"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p aria-live="polite" className="sr-only">
                {loading
                  ? "Loading rings"
                  : `${total} ring${total === 1 ? "" : "s"} found`}
              </p>
              <div
                className={`grid grid-cols-2 gap-3 transition-opacity duration-fast md:grid-cols-3 md:gap-4 lg:grid-cols-4 ${
                  loading ? "opacity-60" : ""
                }`}
              >
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {products.length < total ? (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loading}
                    className="inline-flex min-h-12 items-center rounded-pill border border-hairline bg-pure-white px-8 text-body-lg font-medium text-warm-ink shadow-soft disabled:bg-pale-sand disabled:text-soft-taupe"
                  >
                    {loading ? "Loading…" : "Load more"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter sheet — DESIGN.md §7.14 */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-warm-ink/30"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-card bg-pure-white shadow-float">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <h2 className="text-subheading font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="flex size-11 items-center justify-center"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <FilterPanel
                params={params}
                facets={facets}
                onChange={(patch) => applyParams({ ...params, ...patch })}
              />
            </div>
            <div className="border-t border-hairline p-4">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-champagne-gold px-6 text-body-lg font-medium text-warm-ink shadow-gold-glow"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Small server-friendly helper used by the shop page for headings. */
export function shopHeadingFor(params: ShopParams): string {
  if (params.category) {
    return params.category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  if (params.availability === "pre_order") return "Pre-order collection";
  return "All rings";
}
