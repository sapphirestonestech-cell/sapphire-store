import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { CategoryModel } from "@/lib/models/category";
import { ProductModel } from "@/lib/models/product";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

async function ensureAdmin() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  return null;
}

/** PATCH /api/admin/categories/:id — rename, reorder, hide (§6.4). */
export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  let body: {
    name?: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await connectDb();
    const update: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) {
      update.name = body.name.trim();
    }
    if (typeof body.description === "string") {
      update.description = body.description.trim() || undefined;
    }
    if (typeof body.displayOrder === "number" && Number.isFinite(body.displayOrder)) {
      update.displayOrder = body.displayOrder;
    }
    if (typeof body.isActive === "boolean") {
      update.isActive = body.isActive;
    }
    const res = await CategoryModel.updateOne({ _id: id }, { $set: update });
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The category could not be saved. Try again shortly." },
      { status: 503 },
    );
  }
}

/**
 * DELETE /api/admin/categories/:id — products are never deleted with the
 * category; they simply lose the assignment (§6.4, §17).
 */
export async function DELETE(_request: Request, { params }: Params) {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    await connectDb();
    const res = await CategoryModel.deleteOne({ _id: id });
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    await ProductModel.updateMany(
      { categories: id },
      { $pull: { categories: id } },
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The category could not be deleted. Try again shortly." },
      { status: 503 },
    );
  }
}
