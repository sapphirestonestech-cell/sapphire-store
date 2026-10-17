import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { ProductModel } from "@/lib/models/product";
import { CategoryModel } from "@/lib/models/category";
import { getSession } from "@/lib/session";
import {
  PayloadError,
  validateProductPayload,
  type ProductPayload,
} from "@/lib/admin/product-payload";

async function ensureAdmin() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  return null;
}

async function ensureCategories(ids: string[]): Promise<string[]> {
  const found = await CategoryModel.find({ _id: { $in: ids } }).lean();
  if (found.length !== ids.length) {
    throw new PayloadError("One of the categories no longer exists.");
  }
  return found.map((c) => String(c._id));
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let n = 2;
  for (;;) {
    const clash = await ProductModel.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean();
    if (!clash) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

/** POST /api/admin/products — create a ring (§6.3). */
export async function POST(request: Request) {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;

  let payload: ProductPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await connectDb();
    const data = validateProductPayload(payload);
    const categories = await ensureCategories(data.categories);
    const doc = await ProductModel.create({
      ...data,
      slug: await uniqueSlug(data.slug),
      categories,
    });
    return NextResponse.json({ id: String(doc._id), slug: doc.slug }, { status: 201 });
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
