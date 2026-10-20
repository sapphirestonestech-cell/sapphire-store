import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { ProductModel } from "@/lib/models/product";
import { CategoryModel } from "@/lib/models/category";
import { requireAdmin } from "@/lib/admin/auth";
import {
  PayloadError,
  validateProductPayload,
  type ProductPayload,
} from "@/lib/admin/product-payload";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/products/:id — update a ring (§6.3). */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  let payload: ProductPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await connectDb();
    const existing = await ProductModel.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Ring not found." }, { status: 404 });
    }

    const data = validateProductPayload(payload, existing.slug);

    const found = await CategoryModel.find({
      _id: { $in: data.categories },
    }).lean();
    if (found.length !== data.categories.length) {
      throw new PayloadError("One of the categories no longer exists.");
    }

    // Keep a stable slug once published; edits to the name don't break links.
    await ProductModel.updateOne(
      { _id: id },
      { $set: { ...data, slug: existing.slug } },
    );
    return NextResponse.json({ ok: true, slug: existing.slug });
  } catch (err) {
    if (err instanceof PayloadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "The ring could not be saved. Try again shortly." },
      { status: 503 },
    );
  }
}

/** DELETE /api/admin/products/:id — remove a ring (§6.3 bulk delete). */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    await connectDb();
    const res = await ProductModel.deleteOne({ _id: id });
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Ring not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The ring could not be deleted. Try again shortly." },
      { status: 503 },
    );
  }
}
