import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { AddressModel } from "@/lib/models/customer";

const MAX_ADDRESSES = 10;

export interface AddressView {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  locationId: string;
  phone?: string;
  isDefault: boolean;
}

function toView(doc: {
  _id: unknown;
  label: string;
  line1: string;
  line2?: string | null;
  locationId: unknown;
  phone?: string | null;
  isDefault: boolean;
}): AddressView {
  return {
    id: String(doc._id),
    label: doc.label,
    line1: doc.line1,
    line2: doc.line2 || undefined,
    locationId: String(doc.locationId),
    phone: doc.phone || undefined,
    isDefault: doc.isDefault,
  };
}

async function requireCustomer(): Promise<
  { id: string } | { error: NextResponse }
> {
  const session = await auth();
  const id = session?.user?.customerId;
  if (!id || !mongoose.isValidObjectId(id)) {
    return {
      error: NextResponse.json({ error: "Not signed in." }, { status: 401 }),
    };
  }
  return { id };
}

function parseAddressInput(raw: Record<string, unknown>) {
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  const line1 = typeof raw.line1 === "string" ? raw.line1.trim() : "";
  const line2 = typeof raw.line2 === "string" ? raw.line2.trim() : "";
  const locationId =
    typeof raw.locationId === "string" ? raw.locationId.trim() : "";
  const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
  const isDefault = raw.isDefault === true;
  if (label.length < 1 || label.length > 40) {
    return { error: "Give this address a short label, e.g. Home." };
  }
  if (line1.length < 3) return { error: "Enter your street address." };
  if (!mongoose.isValidObjectId(locationId)) {
    return { error: "Choose a delivery location." };
  }
  return {
    label,
    line1,
    line2: line2 || undefined,
    locationId,
    phone: phone || undefined,
    isDefault,
  };
}

/** GET /api/account/addresses — the signed-in customer's saved addresses. */
export async function GET() {
  const authResult = await requireCustomer();
  if ("error" in authResult) return authResult.error;
  try {
    await connectDb();
    const docs = await AddressModel.find({ customerId: authResult.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    return NextResponse.json({ addresses: docs.map(toView) });
  } catch {
    return NextResponse.json(
      { error: "We couldn't load your addresses." },
      { status: 500 },
    );
  }
}

/** POST /api/account/addresses — save a new address. */
export async function POST(request: Request) {
  const authResult = await requireCustomer();
  if ("error" in authResult) return authResult.error;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = parseAddressInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    await connectDb();
    const count = await AddressModel.countDocuments({
      customerId: authResult.id,
    });
    if (count >= MAX_ADDRESSES) {
      return NextResponse.json(
        { error: `You can save up to ${MAX_ADDRESSES} addresses.` },
        { status: 400 },
      );
    }
    let isDefault = parsed.isDefault;
    if (isDefault) {
      await AddressModel.updateMany(
        { customerId: authResult.id, isDefault: true },
        { $set: { isDefault: false } },
      );
    } else if (count === 0) {
      isDefault = true; // first address is always the default
    }
    const doc = await AddressModel.create({
      ...parsed,
      isDefault,
      customerId: authResult.id,
    });
    return NextResponse.json({ address: toView(doc) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "We couldn't save this address. Try again shortly." },
      { status: 500 },
    );
  }
}
