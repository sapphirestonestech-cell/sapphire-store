/**
 * Seed the database for local development:
 *   npm run seed
 *
 * - Creates/updates the admin user from SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD
 * - Creates the default categories (DECISIONS.md)
 * - Records the opening exchange rate (1600 NGN / USD)
 * - Inserts fixture rings using `placeholder:` images (no stock photos)
 *
 * Idempotent: safe to run more than once. Pass --fresh to wipe catalog data first.
 */
import { config } from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load Next.js-style env files, later files do not override earlier ones.
config({ path: [".env.local", ".env"], quiet: true });

import { connectDb } from "../src/lib/db";
import { ProductModel } from "../src/lib/models/product";
import { CategoryModel } from "../src/lib/models/category";
import {
  AdminUserModel,
  DeliveryLocationModel,
  ExchangeRateModel,
  SettingModel,
} from "../src/lib/models/settings";
import { slugify } from "../src/lib/slug";

const FRESH = process.argv.includes("--fresh");

const CATEGORIES = [
  { name: "Engagement Rings", description: "Rings for the question that matters." },
  { name: "Female Rings", description: "Everyday and statement rings." },
  { name: "Male Rings", description: "Bands and signets built for daily wear." },
  {
    name: "Pre-order Collection",
    description: "Arriving soon — reserve yours now.",
  },
];

/**
 * Dummy delivery locations (fees in the base currency, USD). Replace with
 * the client's real locations and fees before launch (OPEN_QUESTIONS.md).
 */
interface SeedLocation {
  country: string;
  region?: string;
  cityArea: string;
  instockFee: number;
  preorderFee: number;
  minDays: number;
  maxDays: number;
}

const DELIVERY_LOCATIONS: SeedLocation[] = [
  { country: "Nigeria", region: "Lagos", cityArea: "Lagos Island", instockFee: 8, preorderFee: 12, minDays: 2, maxDays: 5 },
  { country: "Nigeria", region: "FCT", cityArea: "Abuja", instockFee: 9, preorderFee: 13, minDays: 3, maxDays: 6 },
  { country: "Nigeria", region: "Rivers", cityArea: "Port Harcourt", instockFee: 10, preorderFee: 14, minDays: 3, maxDays: 7 },
  { country: "Ghana", region: "Greater Accra", cityArea: "Accra", instockFee: 18, preorderFee: 24, minDays: 5, maxDays: 10 },
  { country: "United Kingdom", cityArea: "London", instockFee: 22, preorderFee: 28, minDays: 6, maxDays: 12 },
  { country: "United States", region: "New York", cityArea: "New York City", instockFee: 25, preorderFee: 30, minDays: 7, maxDays: 14 },
];

interface SeedProduct {
  name: string;
  type: "engagement" | "female" | "male";
  category: string;
  shape: string;
  material: string;
  color: string;
  basePrice: number;
  compareAtPrice?: number;
  availability: "in_stock" | "pre_order";
  arrivalInDays?: number;
  isFeatured?: boolean;
  description: string;
  sizes: string[];
  paymentMode?: "full" | "deposit";
  depositPercent?: number;
  freeDeliveryAll?: boolean;
  /** Delivery locations (by city area) this ring ships free to. */
  freeDeliveryLocations?: string[];
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "Aurelia Solitaire",
    type: "engagement",
    category: "Engagement Rings",
    shape: "Round",
    material: "Gold plated sterling silver",
    color: "Gold",
    basePrice: 68,
    compareAtPrice: 89,
    availability: "in_stock",
    isFeatured: true,
    freeDeliveryAll: true,
    description:
      "A single brilliant-cut stone on a slender gold-plated band — quiet, classic, and made to be worn every day.",
    sizes: ["US 5", "US 6", "US 7", "US 8"],
  },
  {
    name: "Vera Halo Ring",
    type: "engagement",
    category: "Engagement Rings",
    shape: "Oval",
    material: "Yellow gold vermeil",
    color: "Gold",
    basePrice: 92,
    availability: "in_stock",
    freeDeliveryLocations: ["Lagos Island", "Abuja"],
    description:
      "An oval centre stone ringed by a fine halo, set on a tapered vermeil band.",
    sizes: ["US 5", "US 6", "US 7", "US 8"],
  },
  {
    name: "Liora Twist Band",
    type: "female",
    category: "Female Rings",
    shape: "Interlocking",
    material: "Rose gold plated",
    color: "Rose gold",
    basePrice: 42,
    availability: "in_stock",
    isFeatured: true,
    description:
      "Two smooth strands cross and settle into one another. Comfortable, stackable, and quietly sculptural.",
    sizes: ["US 5", "US 6", "US 7"],
  },
  {
    name: "Nadia Stone Drop",
    type: "female",
    category: "Female Rings",
    shape: "Marquise",
    material: "Gold plated brass",
    color: "Gold",
    basePrice: 55,
    compareAtPrice: 72,
    availability: "in_stock",
    description:
      "A slim marquise stone drops just below the knuckle on a hammered gold band.",
    sizes: ["US 6", "US 7"],
  },
  {
    name: "Kofi Signet",
    type: "male",
    category: "Male Rings",
    shape: "Signet",
    material: "Brushed stainless steel",
    color: "Silver",
    basePrice: 48,
    availability: "in_stock",
    description:
      "A flat-top signet in brushed steel with a softly polished edge. Substantial without being heavy.",
    sizes: ["US 9", "US 10", "US 11", "US 12"],
  },
  {
    name: "Tobi Grooved Band",
    type: "male",
    category: "Male Rings",
    shape: "Band",
    material: "Gold plated titanium",
    color: "Gold",
    basePrice: 76,
    availability: "in_stock",
    description:
      "A wide band with a single recessed groove running its full circumference.",
    sizes: ["US 9", "US 10", "US 11"],
  },
  {
    name: "Sienna Pavé Eternity",
    type: "female",
    category: "Pre-order Collection",
    shape: "Eternity",
    material: "Gold plated sterling silver",
    color: "Gold",
    basePrice: 84,
    availability: "pre_order",
    arrivalInDays: 45,
    paymentMode: "full",
    description:
      "Micro-set stones run all the way around the band, so the sparkle never stops.",
    sizes: ["US 5", "US 6", "US 7", "US 8"],
  },
  {
    name: "Amara Trilogy",
    type: "engagement",
    category: "Pre-order Collection",
    shape: "Trilogy",
    material: "Yellow gold vermeil",
    color: "Gold",
    basePrice: 110,
    availability: "pre_order",
    arrivalInDays: 60,
    isFeatured: true,
    paymentMode: "deposit",
    depositPercent: 40,
    description:
      "Three graduated stones on a high-polish band — past, present, and what comes next.",
    sizes: ["US 6", "US 7", "US 8"],
  },
];

async function main() {
  await connectDb();
  console.log(`Connected. Seeding${FRESH ? " (fresh)" : ""}…`);

  if (FRESH) {
    await Promise.all([
      ProductModel.deleteMany({}),
      CategoryModel.deleteMany({}),
      DeliveryLocationModel.deleteMany({}),
      ExchangeRateModel.deleteMany({}),
      SettingModel.deleteMany({}),
    ]);
    console.log("  cleared catalog, categories, locations, rates and settings");
  }

  // Admin user -----------------------------------------------------------
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local before seeding.",
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await AdminUserModel.updateOne(
    { email: email.toLowerCase() },
    { $set: { email: email.toLowerCase(), passwordHash, role: "admin" } },
    { upsert: true },
  );
  console.log(`  admin user ready: ${email}`);

  // Settings -------------------------------------------------------------
  const settings: [string, string][] = [
    ["base_currency", "USD"],
    ["tagline", "Luxurious rings at an affordable price."],
    ["store_name", "Sapphire"],
    ["rounding", JSON.stringify({ usdDecimals: 2, ngnNearest: 50 })],
  ];
  for (const [key, value] of settings) {
    await SettingModel.updateOne({ key }, { $set: { value } }, { upsert: true });
  }
  console.log("  settings ready (base currency USD, tagline set)");

  // Exchange rate --------------------------------------------------------
  const existingRate = await ExchangeRateModel.findOne().lean();
  if (!existingRate) {
    await ExchangeRateModel.create({ usdToNgn: 1600, effectiveAt: new Date() });
    console.log("  exchange rate set: 1 USD = 1,600 NGN");
  } else {
    console.log(`  exchange rate kept: 1 USD = ${existingRate.usdToNgn} NGN`);
  }

  // Categories -----------------------------------------------------------
  const categoryIds = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i += 1) {
    const cat = CATEGORIES[i];
    const slug = slugify(cat.name);
    const doc = await CategoryModel.findOneAndUpdate(
      { slug },
      {
        $set: {
          name: cat.name,
          description: cat.description,
          displayOrder: i + 1,
          isActive: true,
        },
      },
      { upsert: true, new: true },
    ).lean();
    if (doc) categoryIds.set(slug, String(doc._id));
  }
  console.log(`  categories ready: ${CATEGORIES.map((c) => c.name).join(", ")}`);

  // Delivery locations ---------------------------------------------------
  const locationIds = new Map<string, string>();
  for (const loc of DELIVERY_LOCATIONS) {
    const doc = await DeliveryLocationModel.findOneAndUpdate(
      { country: loc.country, region: loc.region, cityArea: loc.cityArea },
      {
        $set: {
          country: loc.country,
          region: loc.region,
          cityArea: loc.cityArea,
          instockFee: loc.instockFee,
          preorderFee: loc.preorderFee,
          minDays: loc.minDays,
          maxDays: loc.maxDays,
          isActive: true,
        },
      },
      { upsert: true, new: true },
    ).lean();
    locationIds.set(loc.cityArea, String(doc._id));
  }
  console.log(`  delivery locations ready: ${DELIVERY_LOCATIONS.length}`);

  // Products -------------------------------------------------------------
  let created = 0;
  let updated = 0;
  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const arrival = p.arrivalInDays
      ? new Date(Date.now() + p.arrivalInDays * 24 * 60 * 60 * 1000)
      : undefined;
    const images = [
      { url: `placeholder:${slug}-cover`, label: "Cover", position: 1 },
      { url: `placeholder:${slug}-left`, label: "Left hand", position: 2 },
      { url: `placeholder:${slug}-right`, label: "Right hand", position: 3 },
    ];
    const sizes = p.sizes.map((sizeLabel, i) => ({
      sizeLabel,
      stockQuantity: p.availability === "pre_order" ? 0 : 1 + ((i + 1) % 3),
    }));

    const categoryId = categoryIds.get(slugify(p.category));
    const isDeposit = p.availability === "pre_order" && p.paymentMode === "deposit";
    const freeLocationIds = (p.freeDeliveryLocations ?? [])
      .map((area) => locationIds.get(area))
      .filter((id): id is string => Boolean(id));
    const payload = {
      name: p.name,
      slug,
      description: p.description,
      type: p.type,
      shape: p.shape,
      material: p.material,
      color: p.color,
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      availability: p.availability,
      preorderArrivalDate: arrival,
      preorderMaxQty: p.availability === "pre_order" ? 20 : undefined,
      paymentMode: p.availability === "pre_order" ? (p.paymentMode ?? "full") : "full",
      depositPercent: isDeposit ? p.depositPercent : undefined,
      freeDelivery: {
        allLocations: p.freeDeliveryAll ?? false,
        locationIds: freeLocationIds,
      },
      status: "published" as const,
      isFeatured: p.isFeatured ?? false,
      categories: categoryId ? [categoryId] : [],
      images,
      sizes,
    };

    const existing = await ProductModel.findOne({ slug }).lean();
    if (existing) {
      await ProductModel.updateOne({ slug }, { $set: payload });
      updated += 1;
    } else {
      await ProductModel.create(payload);
      created += 1;
    }
  }
  console.log(`  products: ${created} created, ${updated} updated`);

  console.log("Done. Sign in at /admin/login.");
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\nSeed failed:", err instanceof Error ? err.message : err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
