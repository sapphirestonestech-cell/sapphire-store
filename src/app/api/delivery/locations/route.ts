import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { DeliveryLocationModel } from "@/lib/models/settings";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/delivery/locations — the admin-defined delivery locations with
 * their fees and transit days, for the checkout estimator (ProductReq.md
 * §9). Fees are in the store's base currency. The server recomputes every
 * total again when the order is placed, so this is for display only.
 */
export async function GET() {
  try {
    await connectDb();
    const [locations, settings] = await Promise.all([
      DeliveryLocationModel.find({ isActive: true })
        .sort({ country: 1, cityArea: 1 })
        .lean(),
      getSettings(),
    ]);
    return NextResponse.json({
      baseCurrency: settings.baseCurrency,
      usdToNgn: settings.usdToNgn,
      locations: locations.map((d) => ({
        id: String(d._id),
        label: d.region
          ? `${d.cityArea}, ${d.region}, ${d.country}`
          : `${d.cityArea}, ${d.country}`,
        country: d.country,
        region: d.region ?? null,
        cityArea: d.cityArea,
        instockFee: d.instockFee,
        preorderFee: d.preorderFee,
        minDays: d.minDays,
        maxDays: d.maxDays,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Delivery locations are unavailable right now." },
      { status: 503 },
    );
  }
}
