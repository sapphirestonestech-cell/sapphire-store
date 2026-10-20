import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { WishlistItemModel } from "@/lib/models/wishlist";
import { ProductModel } from "@/lib/models/product";
import { getWishlistForCustomer, type WishlistView } from "@/lib/wishlist-view";

export type { WishlistView };

/**
 * Wishlist endpoints require a signed-in customer — a guest has no wishlist
 * (client instruction, 2026-10-19). Every route starts with this gate.
 */
async function requireCustomer(): Promise<
  { id: string } | { error: NextResponse }
> {
  const session = await auth();
  const id = session?.user?.customerId;
  if (!id || !mongoose.isValidObjectId(id)) {
    return {
      error: NextResponse.json({ error: "Sign in to use your wishlist." }, { status: 401 }),
    };
  }
  return { id };
}

/** GET /api/account/wishlist — the signed-in customer's saved rings, newest first. */
export async function GET() {
  const authResult = await requireCustomer();
  if ("error" in authResult) return authResult.error;
  try {
    const items = await getWishlistForCustomer(authResult.id);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "We couldn't load your wishlist." },
      { status: 500 },
    );
  }
}

/** POST /api/account/wishlist — save a ring. Body: { productId }. */
export async function POST(request: Request) {
  const authResult = await requireCustomer();
  if ("error" in authResult) return authResult.error;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const productId =
    typeof body.productId === "string" ? body.productId.trim() : "";
  if (!mongoose.isValidObjectId(productId)) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }
  try {
    await connectDb();
    const exists = await ProductModel.exists({ _id: productId });
    if (!exists) {
      return NextResponse.json({ error: "Unknown product." }, { status: 404 });
    }
    // Upsert against the unique (customerId, productId) index: adding twice is
    // a no-op, not an error, so a double-click behaves like a single add.
    await WishlistItemModel.updateOne(
      { customerId: authResult.id, productId },
      { $setOnInsert: { customerId: authResult.id, productId } },
      { upsert: true },
    );
    return NextResponse.json({ ok: true, productId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "We couldn't save this ring. Try again shortly." },
      { status: 500 },
    );
  }
}
