import mongoose, { Schema, type Model } from "mongoose";
import type { Currency } from "@/lib/currency";

/**
 * Customer accounts — optional, layered on top of guest checkout
 * (DECISIONS.md 2026-10-18). `passwordHash` is nullable because Google-only
 * accounts have no password. Never store or return the password itself.
 */
export interface CustomerDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  image?: string;
  preferredCurrency: Currency;
  lastLoginAt?: Date;
}

const CustomerSchema = new Schema<CustomerDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    image: { type: String },
    preferredCurrency: { type: String, enum: ["USD", "NGN"], default: "USD" },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const CustomerModel: Model<CustomerDoc> =
  (mongoose.models.Customer as Model<CustomerDoc>) ??
  mongoose.model<CustomerDoc>("Customer", CustomerSchema);

/** Saved delivery address — §12.1 Address, tied to an admin-defined location. */
export interface AddressDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  label: string;
  line1: string;
  line2?: string;
  locationId: mongoose.Types.ObjectId;
  phone?: string;
  isDefault: boolean;
}

const AddressSchema = new Schema<AddressDoc>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    label: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    locationId: { type: Schema.Types.ObjectId, ref: "DeliveryLocation", required: true },
    phone: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const AddressModel: Model<AddressDoc> =
  (mongoose.models.Address as Model<AddressDoc>) ??
  mongoose.model<AddressDoc>("Address", AddressSchema);

/**
 * Password-reset token. Only the SHA-256 hash of the token is stored, so a
 * database leak cannot be used to reset passwords. Single-use; expires after
 * one hour.
 */
export interface PasswordResetTokenDoc extends mongoose.Document {
  customerId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

const PasswordResetTokenSchema = new Schema<PasswordResetTokenDoc>({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  usedAt: Date,
});

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetTokenModel: Model<PasswordResetTokenDoc> =
  (mongoose.models.PasswordResetToken as Model<PasswordResetTokenDoc>) ??
  mongoose.model<PasswordResetTokenDoc>(
    "PasswordResetToken",
    PasswordResetTokenSchema,
  );
