import mongoose, { Schema, type Model } from "mongoose";

export interface CategoryDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  displayOrder: number;
  isActive: boolean;
}

const CategorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    coverImage: String,
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CategoryModel: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc>) ??
  mongoose.model<CategoryDoc>("Category", CategorySchema);
