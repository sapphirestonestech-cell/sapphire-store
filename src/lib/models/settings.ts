import mongoose, { Schema, type Model } from "mongoose";

/** Setting key/value store — base currency, rounding, tagline, expiry window (§6.9, §12.1). */
export interface SettingDoc extends mongoose.Document {
  key: string;
  value: string;
}

const SettingSchema = new Schema<SettingDoc>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

export const SettingModel: Model<SettingDoc> =
  (mongoose.models.Setting as Model<SettingDoc>) ??
  mongoose.model<SettingDoc>("Setting", SettingSchema);

/** Exchange rate history — §6.5, §12.1. */
export interface ExchangeRateDoc extends mongoose.Document {
  usdToNgn: number;
  effectiveAt: Date;
  createdBy?: string;
}

const ExchangeRateSchema = new Schema<ExchangeRateDoc>(
  {
    usdToNgn: { type: Number, required: true, min: 0 },
    effectiveAt: { type: Date, default: Date.now },
    createdBy: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ExchangeRateModel: Model<ExchangeRateDoc> =
  (mongoose.models.ExchangeRate as Model<ExchangeRateDoc>) ??
  mongoose.model<ExchangeRateDoc>("ExchangeRate", ExchangeRateSchema);

/** Admin user — §6.1, §12.1. Password hash only; never the password. */
export interface AdminUserDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  role: "admin" | "staff";
  lastLoginAt?: Date;
}

const AdminUserSchema = new Schema<AdminUserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "admin" },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const AdminUserModel: Model<AdminUserDoc> =
  (mongoose.models.AdminUser as Model<AdminUserDoc>) ??
  mongoose.model<AdminUserDoc>("AdminUser", AdminUserSchema);

/** Delivery location — §9, §12.1. Fees are stored in the base currency. */
export interface DeliveryLocationDoc extends mongoose.Document {
  country: string;
  region?: string;
  cityArea: string;
  instockFee: number;
  preorderFee: number;
  minDays: number;
  maxDays: number;
  freeThreshold?: number;
  isActive: boolean;
}

const DeliveryLocationSchema = new Schema<DeliveryLocationDoc>(
  {
    country: { type: String, required: true },
    region: String,
    cityArea: { type: String, required: true },
    instockFee: { type: Number, required: true, min: 0 },
    preorderFee: { type: Number, required: true, min: 0 },
    minDays: { type: Number, required: true, min: 0 },
    maxDays: { type: Number, required: true, min: 0 },
    freeThreshold: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const DeliveryLocationModel: Model<DeliveryLocationDoc> =
  (mongoose.models.DeliveryLocation as Model<DeliveryLocationDoc>) ??
  mongoose.model<DeliveryLocationDoc>("DeliveryLocation", DeliveryLocationSchema);
