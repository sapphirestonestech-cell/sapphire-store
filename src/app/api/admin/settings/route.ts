import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { ExchangeRateModel, SettingModel } from "@/lib/models/settings";
import { getSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/admin/auth";
import type { Currency } from "@/lib/currency";

async function upsertSetting(key: string, value: string) {
  await SettingModel.updateOne(
    { key },
    { $set: { value } },
    { upsert: true },
  );
}

/** GET /api/admin/settings — store money settings (§6.5, §12.1). */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const settings = await getSettings();
    return NextResponse.json({
      baseCurrency: settings.baseCurrency,
      usdToNgn: settings.usdToNgn,
      usdDecimals: settings.rounding.usdDecimals,
      ngnNearest: settings.rounding.ngnNearest,
      tagline: settings.tagline,
      storeName: settings.storeName,
    });
  } catch {
    return NextResponse.json(
      { error: "Settings are unavailable right now." },
      { status: 503 },
    );
  }
}

/**
 * PATCH /api/admin/settings — set the exchange rate and currency rules.
 * A new rate is appended to history rather than overwriting it, so past
 * orders keep the rate they were placed at (§6.5, §9).
 */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: {
    usdToNgn?: number;
    baseCurrency?: string;
    usdDecimals?: number;
    ngnNearest?: number;
    tagline?: string;
    storeName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const errors: string[] = [];

  let rate: number | undefined;
  if (body.usdToNgn !== undefined) {
    rate = Number(body.usdToNgn);
    if (!Number.isFinite(rate) || rate <= 0) {
      errors.push("The exchange rate must be greater than zero.");
    }
  }

  let baseCurrency: Currency | undefined;
  if (body.baseCurrency !== undefined) {
    if (body.baseCurrency !== "USD" && body.baseCurrency !== "NGN") {
      errors.push("Base currency must be USD or NGN.");
    } else {
      baseCurrency = body.baseCurrency;
    }
  }

  let usdDecimals: number | undefined;
  if (body.usdDecimals !== undefined) {
    usdDecimals = Math.round(Number(body.usdDecimals));
    if (!Number.isFinite(usdDecimals) || usdDecimals < 0 || usdDecimals > 4) {
      errors.push("USD decimals must be between 0 and 4.");
    }
  }

  let ngnNearest: number | undefined;
  if (body.ngnNearest !== undefined) {
    ngnNearest = Math.round(Number(body.ngnNearest));
    if (!Number.isFinite(ngnNearest) || ngnNearest < 0) {
      errors.push("The NGN rounding step must be zero or more.");
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  try {
    await connectDb();
    if (rate !== undefined) {
      await ExchangeRateModel.create({ usdToNgn: rate, effectiveAt: new Date() });
    }
    if (baseCurrency) await upsertSetting("base_currency", baseCurrency);
    if (usdDecimals !== undefined || ngnNearest !== undefined) {
      const current = await getSettings();
      await upsertSetting(
        "rounding",
        JSON.stringify({
          usdDecimals: usdDecimals ?? current.rounding.usdDecimals,
          ngnNearest: ngnNearest ?? current.rounding.ngnNearest,
        }),
      );
    }
    if (body.tagline !== undefined) {
      await upsertSetting("tagline", String(body.tagline).trim());
    }
    if (body.storeName !== undefined) {
      await upsertSetting("store_name", String(body.storeName).trim());
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The settings could not be saved. Try again shortly." },
      { status: 503 },
    );
  }
}
