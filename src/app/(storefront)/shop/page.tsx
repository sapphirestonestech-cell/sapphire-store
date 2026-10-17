import { Suspense } from "react";
import { connection } from "next/server";
import { TAGLINE, POSITIONING_LINE } from "@/lib/tagline";
import {
  ShopExplorer,
  shopHeadingFor,
  type FacetOptions,
  type ShopParams,
} from "@/components/storefront/shop-explorer";
import { GridSkeleton } from "@/components/ui/skeleton";
import { filterOptions, queryProducts } from "@/lib/products";
import { connectDb } from "@/lib/db";
import { CategoryModel } from "@/lib/models/category";

export const metadata = {
  title: "Shop",
  description: TAGLINE,
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

async function loadShopData(params: ShopParams) {
  await connection();
  const [initial, facets, categories] = await Promise.all([
    queryProducts(params, { limit: 24 }),
    filterOptions(),
    (async () => {
      try {
        await connectDb();
        const cats = await CategoryModel.find({ isActive: true })
          .sort({ displayOrder: 1, name: 1 })
          .lean();
        return cats.map((c) => ({ slug: c.slug, name: c.name }));
      } catch {
        return [];
      }
    })(),
  ]);
  return { initial, facets, categories };
}

export default function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <ShopSlot searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopSlot({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const params: ShopParams = {
    category: first(sp.category),
    type: first(sp.type),
    material: first(sp.material),
    color: first(sp.color),
    shape: first(sp.shape),
    size: first(sp.size),
    availability: first(sp.availability),
    min: first(sp.min),
    max: first(sp.max),
    sort: first(sp.sort),
    q: first(sp.q),
  };

  let data: Awaited<ReturnType<typeof loadShopData>> | null = null;
  let failed = false;
  try {
    data = await loadShopData(params);
  } catch {
    failed = true;
  }

  const categoryName = params.category
    ? await lookupCategoryName(params.category)
    : null;

  if (failed) {
    return (
      <div className="page-width py-24">
        <div
          role="alert"
          className="mx-auto max-w-md rounded-card bg-pure-white p-10 text-center shadow-card"
        >
          <p className="text-body-lg text-soft-taupe">
            We couldn&apos;t load the collection right now. Refresh the page to
            try again.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return <GridSkeleton />;

  return (
    <ShopExplorer
      initialProducts={data.initial.products}
      initialTotal={data.initial.total}
      params={params}
      facets={data.facets as FacetOptions}
      heading={
        params.q
          ? `Results for “${params.q}”`
          : (categoryName ?? shopHeadingFor(params))
      }
      tagline={POSITIONING_LINE}
    />
  );
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
