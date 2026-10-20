import type { ProductImageSubdoc, ProductSizeSubdoc } from "@/lib/models/product";
import { normalizeDescription } from "@/lib/rich-text";
import { slugify } from "@/lib/slug";

/** Shape the admin form submits. */
export interface ProductPayload {
  name?: string;
  description?: string;
  type?: string;
  categoryIds?: string[];
  shape?: string;
  material?: string;
  color?: string;
  basePrice?: number | string;
  compareAtPrice?: number | string | null;
  availability?: string;
  preorderArrivalDate?: string | null;
  preorderMaxQty?: number | string | null;
  paymentMode?: string;
  depositPercent?: number | string | null;
  freeDelivery?: {
    allLocations?: boolean;
    locationIds?: string[];
  };
  status?: string;
  isFeatured?: boolean;
  images?: { url: string; publicId?: string; label?: string; position: number }[];
  sizes?: { sizeLabel: string; stockQuantity: number | string }[];
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
}

export interface ValidatedProduct {
  name: string;
  slug: string;
  description: string;
  type: "engagement" | "female" | "male";
  categories: string[];
  shape: string;
  material: string;
  color: string;
  basePrice: number;
  compareAtPrice?: number;
  availability: "in_stock" | "pre_order";
  preorderArrivalDate?: Date;
  preorderMaxQty?: number;
  paymentMode: "full" | "deposit";
  depositPercent?: number;
  freeDelivery: { allLocations: boolean; locationIds: string[] };
  status: "draft" | "published" | "hidden";
  isFeatured: boolean;
  images: ProductImageSubdoc[];
  sizes: ProductSizeSubdoc[];
  seoTitle?: string;
  seoDescription?: string;
}

export class PayloadError extends Error {}

/** Server-side validation — never trust the browser alone (§14.2). */
export function validateProductPayload(
  payload: ProductPayload,
  existingSlug?: string,
): ValidatedProduct {
  const name = payload.name?.trim();
  if (!name) throw new PayloadError("Name is required.");

  const type = payload.type;
  if (type !== "engagement" && type !== "female" && type !== "male") {
    throw new PayloadError("Choose a ring type: engagement, female or male.");
  }

  if (!Array.isArray(payload.categoryIds) || payload.categoryIds.length === 0) {
    throw new PayloadError("Choose at least one category.");
  }

  const shape = payload.shape?.trim();
  const material = payload.material?.trim();
  const color = payload.color?.trim();
  if (!shape) throw new PayloadError("Shape is required.");
  if (!material) throw new PayloadError("Material is required.");
  if (!color) throw new PayloadError("Color is required.");

  const basePrice = Number(payload.basePrice);
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new PayloadError("Enter a valid price.");
  }

  const availability = payload.availability;
  if (availability !== "in_stock" && availability !== "pre_order") {
    throw new PayloadError("Choose availability: in stock or pre-order.");
  }

  let preorderArrivalDate: Date | undefined;
  if (availability === "pre_order") {
    if (!payload.preorderArrivalDate) {
      throw new PayloadError("Pre-order products need an arrival date.");
    }
    const d = new Date(payload.preorderArrivalDate);
    if (Number.isNaN(d.getTime())) {
      throw new PayloadError("Enter a valid arrival date.");
    }
    if (d.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      throw new PayloadError("The arrival date must be in the future.");
    }
    preorderArrivalDate = d;
  }

  const status = payload.status;
  if (status !== "draft" && status !== "published" && status !== "hidden") {
    throw new PayloadError("Choose a status: draft, published or hidden.");
  }

  const images = Array.isArray(payload.images) ? payload.images.slice(0, 4) : [];
  if (images.length > 4) {
    throw new PayloadError("A ring can have at most four images.");
  }
  if (status === "published" && images.length === 0) {
    throw new PayloadError("Add at least one image before publishing.");
  }
  const normalizedImages: ProductImageSubdoc[] = images.map((img, i) => {
    if (!img?.url) throw new PayloadError(`Image ${i + 1} is missing its file.`);
    return {
      url: img.url,
      publicId: img.publicId,
      label: img.label?.trim() || undefined,
      position: (i + 1) as number,
    };
  });

  const sizes: ProductSizeSubdoc[] = (Array.isArray(payload.sizes) ? payload.sizes : [])
    .map((s) => ({
      sizeLabel: String(s.sizeLabel ?? "").trim(),
      stockQuantity: Number(s.stockQuantity),
    }))
    .filter((s) => s.sizeLabel.length > 0)
    .map((s) => {
      if (!Number.isFinite(s.stockQuantity) || s.stockQuantity < 0) {
        throw new PayloadError(`Stock for size ${s.sizeLabel} is invalid.`);
      }
      return s;
    });

  const compareAt = payload.compareAtPrice ? Number(payload.compareAtPrice) : undefined;
  if (compareAt !== undefined && (!Number.isFinite(compareAt) || compareAt < 0)) {
    throw new PayloadError("Enter a valid compare-at price.");
  }

  const maxQty = payload.preorderMaxQty ? Number(payload.preorderMaxQty) : undefined;
  if (maxQty !== undefined && (!Number.isFinite(maxQty) || maxQty < 1)) {
    throw new PayloadError("Maximum pre-order quantity must be at least 1.");
  }

  // Pre-order payment mode (Phase 2 decision): full, or a deposit percentage.
  let paymentMode: "full" | "deposit" = "full";
  let depositPercent: number | undefined;
  if (availability === "pre_order" && payload.paymentMode === "deposit") {
    const pct = Number(payload.depositPercent);
    if (!Number.isFinite(pct) || pct < 1 || pct > 99) {
      throw new PayloadError("Enter a deposit percentage between 1 and 99.");
    }
    paymentMode = "deposit";
    depositPercent = Math.round(pct);
  }

  // Free delivery (Phase 2 decision): all locations, or a chosen set.
  const freeAll = payload.freeDelivery?.allLocations === true;
  const freeIds = Array.isArray(payload.freeDelivery?.locationIds)
    ? payload.freeDelivery!.locationIds.map(String).filter(Boolean)
    : [];
  const freeDelivery = {
    allLocations: freeAll,
    locationIds: freeAll ? [] : freeIds,
  };

  const slugSource = payload.slug?.trim() || existingSlug || slugify(name);
  const slug = slugify(slugSource) || slugify(name);

  return {
    name,
    slug,
    description: normalizeDescription(payload.description),
    type,
    categories: payload.categoryIds.map(String),
    shape,
    material,
    color,
    basePrice,
    compareAtPrice: compareAt,
    availability,
    preorderArrivalDate,
    preorderMaxQty: maxQty,
    paymentMode,
    depositPercent,
    freeDelivery,
    status,
    isFeatured: payload.isFeatured === true,
    images: normalizedImages,
    sizes,
    seoTitle: payload.seoTitle?.trim() || undefined,
    seoDescription: payload.seoDescription?.trim() || undefined,
  };
}
