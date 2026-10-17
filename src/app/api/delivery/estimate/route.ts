import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { DeliveryLocationModel } from "@/lib/models/settings";
import { ProductModel } from "@/lib/models/product";
import { getSettings } from "@/lib/settings";
import { formatArrivalShort } from "@/lib/format";

/**
 * POST /api/delivery/estimate — location + availability returns the fee
 * and days (§5.3, §9, §13.1). Fees are returned in the store's base
 * currency; the client renders them through the active-currency Price.
 * When a productId is given, that product's free-delivery rule is applied.
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

  const { locationId, productId, availability, arrivalDate } = body;
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

    const settings = await getSettings();
    const isPreorder = availability === "pre_order";

    let freeDelivery = false;
    if (productId) {
      const product = await ProductModel.findById(productId)
        .select("freeDelivery")
        .lean();
      const rule = product?.freeDelivery;
      freeDelivery = Boolean(
        rule?.allLocations ||
          rule?.locationIds?.some((id) => String(id) === String(location._id)),
      );
    }

    const feeBase = isPreorder ? location.preorderFee : location.instockFee;

    return NextResponse.json({
      kind: isPreorder ? "preorder" : "in_stock",
      locationLabel: location.cityArea,
      feeBase: freeDelivery ? 0 : feeBase,
      freeDelivery,
      baseCurrency: settings.baseCurrency,
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
