import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { WishlistItemModel } from "@/lib/models/wishlist";

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

/** DELETE /api/account/wishlist/[productId] — remove a saved ring. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const authResult = await requireCustomer();
  if ("error" in authResult) return authResult.error;
  const { productId } = await params;
  if (!mongoose.isValidObjectId(productId)) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }
  try {
    await connectDb();
    await WishlistItemModel.deleteOne({
      customerId: authResult.id,
      productId,
    });
    return NextResponse.json({ ok: true, productId });
  } catch {
    return NextResponse.json(
      { error: "We couldn't update your wishlist. Try again shortly." },
      { status: 500 },
    );
  }
}
