import mongoose, { Schema, type Model } from "mongoose";

export interface ProductImageSubdoc {
  url: string;
  publicId?: string;
  label?: string;
  position: number;
}

export interface ProductSizeSubdoc {
  sizeLabel: string;
  stockQuantity: number;
}

/**
 * Per-product free-delivery rule (Phase 2 decision). Applies to all
 * locations, or only to the listed delivery-location ids.
 */
export interface ProductFreeDeliverySubdoc {
  allLocations: boolean;
  locationIds: mongoose.Types.ObjectId[];
}

export interface ProductDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  type: "engagement" | "female" | "male";
  shape: string;
  material: string;
  color: string;
  basePrice: number;
  compareAtPrice?: number;
  availability: "in_stock" | "pre_order";
  preorderArrivalDate?: Date;
  preorderMaxQty?: number;
  /** Pre-order payment: paid in full, or by deposit (Phase 2 decision). */
  paymentMode: "full" | "deposit";
  /** Percentage due now when paymentMode is "deposit" (1–99). */
  depositPercent?: number;
  freeDelivery: ProductFreeDeliverySubdoc;
  status: "draft" | "published" | "hidden";
  isFeatured: boolean;
  categories: mongoose.Types.ObjectId[];
  images: ProductImageSubdoc[];
  sizes: ProductSizeSubdoc[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<ProductDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      required: true,
      enum: ["engagement", "female", "male"],
    },
    shape: { type: String, required: true, trim: true },
    material: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    availability: {
      type: String,
      required: true,
      enum: ["in_stock", "pre_order"],
    },
    preorderArrivalDate: {
      type: Date,
      validate: {
        validator: function (this: ProductDoc, value?: Date) {
          if (this.availability !== "pre_order") return true;
          return value != null;
        },
        message: "A pre-order product requires an arrival date.",
      },
    },
    preorderMaxQty: { type: Number, min: 1 },
    paymentMode: {
      type: String,
      enum: ["full", "deposit"],
      default: "full",
    },
    depositPercent: {
      type: Number,
      validate: {
        validator: function (this: ProductDoc, value?: number) {
          if (this.availability !== "pre_order" || this.paymentMode !== "deposit") {
            return true;
          }
          return typeof value === "number" && value >= 1 && value <= 99;
        },
        message: "A deposit pre-order needs a deposit percentage between 1 and 99.",
      },
    },
    freeDelivery: {
      allLocations: { type: Boolean, default: false },
      locationIds: {
        type: [{ type: Schema.Types.ObjectId, ref: "DeliveryLocation" }],
        default: [],
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "hidden"],
      default: "draft",
    },
    isFeatured: { type: Boolean, default: false },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    images: {
      type: [
        new Schema<ProductImageSubdoc>(
          {
            url: { type: String, required: true },
            publicId: String,
            label: String,
            position: { type: Number, required: true, min: 1, max: 4 },
          },
          { _id: false },
        ),
      ],
      default: [],
      validate: {
        // ProductReq.md §6.3 / §17: never more than four images.
        validator: (images: ProductImageSubdoc[]) => images.length <= 4,
        message: "A ring can have at most four images.",
      },
    },
    sizes: {
      type: [
        new Schema<ProductSizeSubdoc>(
          {
            sizeLabel: { type: String, required: true },
            stockQuantity: { type: Number, required: true, min: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true },
);

export const ProductModel: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) ??
  mongoose.model<ProductDoc>("Product", ProductSchema);
