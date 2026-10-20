import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { WishlistItemModel } from "@/lib/models/wishlist";
import { ProductModel } from "@/lib/models/product";
import { toSummary, type ProductSummary } from "@/lib/products";

export interface WishlistView {
  productId: string;
  /** Full card-ready summary, or null when the product was since deleted. */
  product: ProductSummary | null;
  addedAt: string;
}

/**
 * The signed-in customer's saved rings, newest first, resolved against live
 * product data. This is the one wishlist read used by both the account page
 * (server component) and `GET /api/account/wishlist`, so the two can never
 * disagree.
 */
export async function getWishlistForCustomer(
  customerId: string,
): Promise<WishlistView[]> {
  if (!mongoose.isValidObjectId(customerId)) return [];
  await connectDb();
  const items = await WishlistItemModel.find({ customerId })
    .sort({ createdAt: -1 })
    .lean();
  if (items.length === 0) return [];

  const ids = items.map((item) => item.productId);
  const products = await ProductModel.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  return items.map((item) => {
    const doc = byId.get(item.productId.toString());
    return {
      productId: item.productId.toString(),
      product: doc ? toSummary(doc as never) : null,
      addedAt: new Date(item.createdAt ?? Date.now()).toISOString(),
    };
  });
}
