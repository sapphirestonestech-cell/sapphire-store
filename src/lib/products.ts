import type { QueryFilter } from "mongoose";
import { connectDb } from "@/lib/db";
import { ProductModel, type ProductDoc } from "@/lib/models/product";

/** Product filters from the URL, ProductReq.md §5.2. */
export interface ProductFilterParams {
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
}

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  "price-asc": { basePrice: 1 },
  "price-desc": { basePrice: -1 },
  "name-az": { name: 1 },
};

export type ProductQuery = QueryFilter<ProductDoc>;

export function buildProductQuery(
  params: ProductFilterParams,
  categoryIds?: Map<string, string>,
): ProductQuery {
  const query: ProductQuery = { status: "published" };

  if (params.category && categoryIds?.has(params.category)) {
    const categoryId = categoryIds.get(params.category);
    if (categoryId) query.categories = { $in: [categoryId] };
  }
  if (params.type === "engagement" || params.type === "female" || params.type === "male") {
    query.type = params.type;
  }
  if (params.material) query.material = params.material;
  if (params.color) query.color = params.color;
  if (params.shape) query.shape = params.shape;
  if (params.availability === "in_stock" || params.availability === "pre_order") {
    query.availability = params.availability;
  }
  if (params.size) query["sizes.sizeLabel"] = params.size;

  const min = params.min !== undefined ? Number(params.min) : NaN;
  const max = params.max !== undefined ? Number(params.max) : NaN;
  if (Number.isFinite(min) || Number.isFinite(max)) {
    query.basePrice = {};
    if (Number.isFinite(min)) query.basePrice.$gte = min;
    if (Number.isFinite(max)) query.basePrice.$lte = max;
  }

  if (params.q?.trim()) {
    const rx = { $regex: params.q.trim(), $options: "i" };
    query.$or = [{ name: rx }, { description: rx }, { material: rx }];
  }

  return query;
}

export function sortSpec(sort?: string): Record<string, 1 | -1> {
  return SORTS[sort ?? "newest"] ?? SORTS.newest;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice: number | null;
  availability: "in_stock" | "pre_order";
  preorderArrivalDate: string | null;
  paymentMode: "full" | "deposit";
  depositPercent: number | null;
  /** Admin-set per-order cap for pre-order rings (null when unlimited/absent). */
  preorderMaxQty: number | null;
  freeDelivery: { allLocations: boolean; locationIds: string[] };
  type: string;
  shape: string;
  material: string;
  color: string;
  coverImage: { url: string; label: string | null } | null;
  images: { url: string; label: string | null; position: number }[];
  sizes: { sizeLabel: string; stockQuantity: number }[];
  isFeatured: boolean;
  createdAt: string;
}

export function toSummary(doc: ProductDoc): ProductSummary {
  const images = [...doc.images]
    .sort((a, b) => a.position - b.position)
    .map((img) => ({
      url: img.url,
      label: img.label ?? null,
      position: img.position,
    }));
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    basePrice: doc.basePrice,
    compareAtPrice: doc.compareAtPrice ?? null,
    availability: doc.availability,
    preorderArrivalDate: doc.preorderArrivalDate
      ? new Date(doc.preorderArrivalDate).toISOString().slice(0, 10)
      : null,
    paymentMode: doc.paymentMode ?? "full",
    depositPercent:
      doc.availability === "pre_order" && doc.paymentMode === "deposit"
        ? (doc.depositPercent ?? null)
        : null,
    preorderMaxQty:
      doc.availability === "pre_order" && typeof doc.preorderMaxQty === "number"
        ? doc.preorderMaxQty
        : null,
    freeDelivery: {
      allLocations: doc.freeDelivery?.allLocations ?? false,
      locationIds: (doc.freeDelivery?.locationIds ?? []).map((id) => String(id)),
    },
    type: doc.type,
    shape: doc.shape,
    material: doc.material,
    color: doc.color,
    coverImage: images[0] ?? null,
    images,
    sizes: doc.sizes.map((s) => ({
      sizeLabel: s.sizeLabel,
      stockQuantity: s.stockQuantity,
    })),
    isFeatured: doc.isFeatured,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export async function queryProducts(
  params: ProductFilterParams,
  opts: { limit?: number; skip?: number } = {},
): Promise<{ products: ProductSummary[]; total: number }> {
  await connectDb();
  const categoryIds = await categorySlugMap();
  const query = buildProductQuery(params, categoryIds);
  const limit = Math.min(opts.limit ?? 24, 48);
  const [docs, total] = await Promise.all([
    ProductModel.find(query)
      .sort(sortSpec(params.sort))
      .skip(opts.skip ?? 0)
      .limit(limit)
      .lean(),
    ProductModel.countDocuments(query),
  ]);
  return {
    products: docs.map((d) => toSummary(d as unknown as ProductDoc)),
    total,
  };
}

export async function categorySlugMap(): Promise<Map<string, string>> {
  const { CategoryModel } = await import("@/lib/models/category");
  await connectDb();
  const cats = await CategoryModel.find({ isActive: true }).lean();
  return new Map(cats.map((c) => [c.slug, String(c._id)]));
}

/** Cheapest and most expensive published prices, in base currency — bounds for the budget range bar. */
export async function priceBounds(): Promise<{ min: number; max: number } | null> {
  await connectDb();
  const [agg] = await ProductModel.aggregate<{ min: number; max: number }>([
    { $match: { status: "published" } },
    { $group: { _id: null, min: { $min: "$basePrice" }, max: { $max: "$basePrice" } } },
  ]).allowDiskUse(true);
  if (!agg || !Number.isFinite(agg.min) || !Number.isFinite(agg.max)) return null;
  return { min: Math.floor(agg.min), max: Math.ceil(agg.max) };
}

/** Distinct filter option values, derived from the catalog (free-text spec fields). */
export async function filterOptions(): Promise<{
  materials: string[];
  colors: string[];
  shapes: string[];
  sizes: string[];
}> {
  await connectDb();
  const [materials, colors, shapes, sizes] = await Promise.all([
    ProductModel.distinct("material", { status: "published" }),
    ProductModel.distinct("color", { status: "published" }),
    ProductModel.distinct("shape", { status: "published" }),
    ProductModel.distinct("sizes.sizeLabel", { status: "published" }),
  ]);
  const clean = (arr: unknown[]) =>
    arr.filter((v): v is string => typeof v === "string" && v.length > 0).sort();
  return {
    materials: clean(materials),
    colors: clean(colors),
    shapes: clean(shapes),
    sizes: clean(sizes),
  };
}
