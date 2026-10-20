import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { DeliveryLocationModel } from "@/lib/models/settings";
import { ProductModel } from "@/lib/models/product";
import { requireAdmin } from "@/lib/admin/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface LocationInput {
  country?: string;
  region?: string;
  cityArea?: string;
  instockFee?: number;
  preorderFee?: number;
  minDays?: number;
  maxDays?: number;
  isActive?: boolean;
}

/** PATCH /api/admin/delivery/:id — edit a delivery location (§9). */
export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  let body: LocationInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.country !== undefined) update.country = String(body.country).trim();
  if (body.region !== undefined) update.region = String(body.region).trim() || undefined;
  if (body.cityArea !== undefined) update.cityArea = String(body.cityArea).trim();
  for (const key of ["instockFee", "preorderFee", "minDays", "maxDays"] as const) {
    if (body[key] !== undefined) {
      const value = Number(body[key]);
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          { error: "Fees and days must be zero or more." },
          { status: 400 },
        );
      }
      update[key] = value;
    }
  }
  if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);

  try {
    await connectDb();
    const existing = await DeliveryLocationModel.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }
    const minDays = (update.minDays as number | undefined) ?? existing.minDays;
    const maxDays = (update.maxDays as number | undefined) ?? existing.maxDays;
    if (maxDays < minDays) {
      return NextResponse.json(
        { error: "Maximum days cannot be less than minimum days." },
        { status: 400 },
      );
    }
    await DeliveryLocationModel.updateOne({ _id: id }, { $set: update });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The location could not be saved. Try again shortly." },
      { status: 503 },
    );
  }
}

/**
 * DELETE /api/admin/delivery/:id — remove a delivery location. Products
 * that offered free delivery to it simply lose that entry (§17).
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    await connectDb();
    await Promise.all([
      DeliveryLocationModel.deleteOne({ _id: id }),
      ProductModel.updateMany(
        { "freeDelivery.locationIds": id },
        { $pull: { "freeDelivery.locationIds": id } },
      ),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The location could not be removed. Try again shortly." },
      { status: 503 },
    );
  }
}
