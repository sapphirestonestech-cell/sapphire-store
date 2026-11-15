import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { DeliveryLocationModel } from "@/lib/models/settings";
import { formatArrivalShort } from "@/lib/format";

/**
 * POST /api/delivery/estimate — location + availability returns the transit
 * days (§5.3, §9, §13.1). Fees are deliberately not returned: customers are
 * never shown or charged a delivery fee online (DECISIONS 2026-11-16).
 */
export async function POST(request: Request) {
  let body: {
    locationId?: string;
    productId?: string;
    availability?: string;
    arrivalDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { locationId, availability, arrivalDate } = body;
  if (!locationId) {
    return NextResponse.json(
      { error: "Choose a location to see delivery details." },
      { status: 400 },
    );
  }

  try {
    await connectDb();
    const location = await DeliveryLocationModel.findById(locationId).lean();
    if (!location || !location.isActive) {
      return NextResponse.json({
        kind: "not_served",
        message: "We don't deliver to this location yet.",
      });
    }

    const isPreorder = availability === "pre_order";

    return NextResponse.json({
      kind: isPreorder ? "preorder" : "in_stock",
      locationLabel: location.cityArea,
      minDays: location.minDays,
      maxDays: location.maxDays,
      daysLabel: `${location.minDays} to ${location.maxDays} days`,
      arrivalLabel:
        isPreorder && arrivalDate ? formatArrivalShort(arrivalDate) : null,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Delivery details are unavailable right now. Try again shortly.",
      },
      { status: 503 },
    );
  }
}
