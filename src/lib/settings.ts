import { connectDb } from "@/lib/db";
import {
  DEFAULT_ROUNDING,
  DEFAULT_USD_TO_NGN,
  type Currency,
  type RoundingSettings,
} from "@/lib/currency";
import {
  DeliveryLocationModel,
  ExchangeRateModel,
  SettingModel,
} from "@/lib/models/settings";

export interface StoreSettings {
  baseCurrency: Currency;
  usdToNgn: number;
  rounding: RoundingSettings;
  tagline: string;
  announcementExtra: string;
  storeName: string;
}

const DEFAULTS: StoreSettings = {
  baseCurrency: "USD",
  usdToNgn: DEFAULT_USD_TO_NGN,
  rounding: DEFAULT_ROUNDING,
  tagline: "Luxurious rings at an affordable price.",
  announcementExtra: "",
  storeName: "Sapphire",
};

function parseRounding(raw?: string): RoundingSettings {
  if (!raw) return DEFAULT_ROUNDING;
  try {
    const parsed = JSON.parse(raw) as Partial<RoundingSettings>;
    return {
      usdDecimals:
        typeof parsed.usdDecimals === "number"
          ? parsed.usdDecimals
          : DEFAULT_ROUNDING.usdDecimals,
      ngnNearest:
        typeof parsed.ngnNearest === "number"
          ? parsed.ngnNearest
          : DEFAULT_ROUNDING.ngnNearest,
    };
  } catch {
    return DEFAULT_ROUNDING;
  }
}

/** Read store settings; falls back to defaults if the DB is unreachable. */
export async function getSettings(): Promise<StoreSettings> {
  try {
    await connectDb();
    const [keys, rate] = await Promise.all([
      SettingModel.find({
        key: {
          $in: [
            "base_currency",
            "rounding",
            "tagline",
            "announcement_extra",
            "store_name",
          ],
        },
      }).lean(),
      ExchangeRateModel.findOne().sort({ effectiveAt: -1 }).lean(),
    ]);
    const map = new Map(keys.map((k) => [k.key, k.value]));
    const base = (map.get("base_currency") ?? DEFAULTS.baseCurrency) as Currency;
    return {
      baseCurrency: base === "NGN" ? "NGN" : "USD",
      usdToNgn: rate?.usdToNgn ?? DEFAULTS.usdToNgn,
      rounding: parseRounding(map.get("rounding")),
      tagline: map.get("tagline") ?? DEFAULTS.tagline,
      announcementExtra: map.get("announcement_extra") ?? "",
      storeName: map.get("store_name") ?? DEFAULTS.storeName,
    };
  } catch {
    return DEFAULTS;
  }
}

export interface DeliveryLocationOption {
  id: string;
  label: string;
}

export async function getDeliveryLocations(): Promise<DeliveryLocationOption[]> {
  try {
    await connectDb();
    const docs = await DeliveryLocationModel.find({ isActive: true })
      .sort({ country: 1, cityArea: 1 })
      .lean();
    return docs.map((d) => ({
      id: String(d._id),
      label: d.region
        ? `${d.cityArea}, ${d.region}, ${d.country}`
        : `${d.cityArea}, ${d.country}`,
    }));
  } catch {
    return [];
  }
}
