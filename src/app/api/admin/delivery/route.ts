import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { DeliveryLocationModel } from "@/lib/models/settings";
import { requireAdmin } from "@/lib/admin/auth";

interface LocationInput {
  country?: string;
  region?: string;
  cityArea?: string;
  instockFee?: number;
  preorderFee?: number;
  minDays?: number;
  maxDays?: number;
}

function validateInput(body: LocationInput, partial: boolean) {
  const errors: string[] = [];
  const values: Record<string, unknown> = {};

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  if (!partial || body.country !== undefined) {
    const country = str(body.country);
    if (!country) errors.push("Country is required.");
    values.country = country;
  }
  if (!partial || body.cityArea !== undefined) {
    const cityArea = str(body.cityArea);
    if (!cityArea) errors.push("City or area is required.");
    values.cityArea = cityArea;
  }
  if (body.region !== undefined) values.region = str(body.region) || undefined;

  const num = (v: unknown) => (typeof v === "number" ? v : Number(v));
  for (const key of ["instockFee", "preorderFee", "minDays", "maxDays"] as const) {
    if (!partial || body[key] !== undefined) {
      const value = num(body[key]);
      if (!Number.isFinite(value) || value < 0) {
        errors.push("Fees and days must be zero or more.");
        break;
      }
      values[key] = value;
    }
  }

  if (partial && values.minDays !== undefined && values.maxDays !== undefined) {
    if ((values.maxDays as number) < (values.minDays as number)) {
      errors.push("Maximum days cannot be less than minimum days.");
    }
  }

  return { errors, values };
}

/** GET /api/admin/delivery — every delivery location (§9, §12.1). */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectDb();
    const docs = await DeliveryLocationModel.find()
      .sort({ country: 1, cityArea: 1 })
      .lean();
    return NextResponse.json({
      locations: docs.map((d) => ({
        id: String(d._id),
        country: d.country,
        region: d.region ?? "",
        cityArea: d.cityArea,
        instockFee: d.instockFee,
        preorderFee: d.preorderFee,
        minDays: d.minDays,
        maxDays: d.maxDays,
        isActive: d.isActive,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Delivery locations are unavailable right now." },
      { status: 503 },
    );
  }
}

/** POST /api/admin/delivery — create a delivery location. */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: LocationInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { errors, values } = validateInput(body, false);
  if (values.minDays !== undefined && values.maxDays !== undefined) {
    if ((values.maxDays as number) < (values.minDays as number)) {
      errors.push("Maximum days cannot be less than minimum days.");
    }
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  try {
    await connectDb();
    const doc = await DeliveryLocationModel.create({ ...values, isActive: true });
    return NextResponse.json({ id: String(doc._id) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "The location could not be saved. Try again shortly." },
      { status: 503 },
    );
  }
}
