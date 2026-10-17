import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

/** GET /api/currency/context — detected country, default currency, current rate (§13.1). */
export async function GET() {
  const settings = await getSettings();
  // Phase 2 stub: geolocation detection lands here (§7.3). Default USD.
  return NextResponse.json({
    defaultCurrency: "USD",
    baseCurrency: settings.baseCurrency,
    usdToNgn: settings.usdToNgn,
    rounding: settings.rounding,
  });
}
