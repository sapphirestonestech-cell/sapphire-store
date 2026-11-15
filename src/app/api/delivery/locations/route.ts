import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { DeliveryLocationModel } from "@/lib/models/settings";

/**
 * GET /api/delivery/locations — the admin-defined delivery locations with
 * their transit days, for the checkout estimator (ProductReq.md §9).
 * Fees are deliberately not returned: customers are never shown or charged a
 * delivery fee online (DECISIONS 2026-11-16). The server still applies the
 * admin's fee rules when the order is placed.
 */
export async function GET() {
  try {
    await connectDb();
    const locations = await DeliveryLocationModel.find({ isActive: true })
      .sort({ country: 1, cityArea: 1 })
      .lean();
    return NextResponse.json({
      locations: locations.map((d) => ({
        id: String(d._id),
        label: d.region
          ? `${d.cityArea}, ${d.region}, ${d.country}`
          : `${d.cityArea}, ${d.country}`,
        country: d.country,
        region: d.region ?? null,
        cityArea: d.cityArea,
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
