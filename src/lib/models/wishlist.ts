import mongoose, { Schema, type Model } from "mongoose";

/**
 * Wishlist — a signed-in customer's saved rings. Sign-in is required (a guest
 * has no wishlist), enforced by the API. A product can appear at most once per
 * customer, enforced by the unique compound index rather than by an
 * application-level check, so a double-click cannot create a duplicate.
 */
export interface WishlistItemDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<WishlistItemDoc>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true },
);

WishlistItemSchema.index({ customerId: 1, productId: 1 }, { unique: true });

export const WishlistItemModel: Model<WishlistItemDoc> =
  (mongoose.models.WishlistItem as Model<WishlistItemDoc>) ??
  mongoose.model<WishlistItemDoc>("WishlistItem", WishlistItemSchema);
