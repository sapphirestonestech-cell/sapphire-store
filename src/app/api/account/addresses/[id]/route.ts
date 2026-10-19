import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { AddressModel } from "@/lib/models/customer";

async function findOwnedAddress(id: string, customerId: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  return AddressModel.findOne({ _id: id, customerId });
}

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/account/addresses/[id] — update label/lines/phone/default. */
export async function PATCH(request: Request, ctx: Ctx) {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!customerId || !mongoose.isValidObjectId(customerId)) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    await connectDb();
    const doc = await findOwnedAddress(id, customerId);
    if (!doc) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }
    if (typeof body.label === "string") {
      const label = body.label.trim();
      if (label.length < 1 || label.length > 40) {
        return NextResponse.json(
          { error: "Give this address a short label, e.g. Home." },
          { status: 400 },
        );
      }
      doc.label = label;
    }
    if (typeof body.line1 === "string") {
      const line1 = body.line1.trim();
      if (line1.length < 3) {
        return NextResponse.json(
          { error: "Enter your street address." },
          { status: 400 },
        );
      }
      doc.line1 = line1;
    }
    if (typeof body.line2 === "string") doc.line2 = body.line2.trim() || undefined;
    if (typeof body.phone === "string") doc.phone = body.phone.trim() || undefined;
    if (
      typeof body.locationId === "string" &&
      mongoose.isValidObjectId(body.locationId)
    ) {
      doc.locationId = new mongoose.Types.ObjectId(body.locationId);
    }
    if (body.isDefault === true) {
      await AddressModel.updateMany(
        { customerId, isDefault: true, _id: { $ne: doc._id } },
        { $set: { isDefault: false } },
      );
      doc.isDefault = true;
    } else if (body.isDefault === false) {
      doc.isDefault = false;
    }
    await doc.save();
    return NextResponse.json({
      address: {
        id: String(doc._id),
        label: doc.label,
        line1: doc.line1,
        line2: doc.line2 || undefined,
        locationId: String(doc.locationId),
        phone: doc.phone || undefined,
        isDefault: doc.isDefault,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "We couldn't update this address. Try again shortly." },
      { status: 500 },
    );
  }
}

/** DELETE /api/account/addresses/[id] — remove a saved address. */
export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!customerId || !mongoose.isValidObjectId(customerId)) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await connectDb();
    const doc = await findOwnedAddress(id, customerId);
    if (!doc) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }
    await doc.deleteOne();
    // Promote another address to default so the account always has one.
    if (doc.isDefault) {
      const next = await AddressModel.findOne({ customerId }).sort({
        createdAt: -1,
      });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "We couldn't delete this address. Try again shortly." },
      { status: 500 },
    );
  }
}
