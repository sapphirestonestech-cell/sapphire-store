import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { CategoryModel } from "@/lib/models/category";
import { ProductModel } from "@/lib/models/product";
import { getSession } from "@/lib/session";
import { slugify } from "@/lib/slug";

async function ensureAdmin() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  return null;
}

/** POST /api/admin/categories — create a category (§6.4). */
export async function POST(request: Request) {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;

  let body: { name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  try {
    await connectDb();
    let slug = slugify(name);
    let n = 2;
    while (await CategoryModel.findOne({ slug }).lean()) {
      slug = `${slugify(name)}-${n}`;
      n += 1;
    }
    const maxOrder = await CategoryModel.findOne()
      .sort({ displayOrder: -1 })
      .select("displayOrder")
      .lean();
    const doc = await CategoryModel.create({
      name,
      slug,
      description: body.description?.trim() || undefined,
      displayOrder: (maxOrder?.displayOrder ?? 0) + 1,
    });
    return NextResponse.json(
      { id: String(doc._id), slug: doc.slug },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "The category could not be saved. Try again shortly." },
      { status: 503 },
    );
  }
}

/** DELETE /api/admin/categories/:id handled in [id]/route.ts.
 *  Products are never deleted with their category (§6.4, §17). */
export async function DELETE() {
  return NextResponse.json(
    { error: "Use the category's own endpoint." },
    { status: 400 },
  );
}

export async function GET() {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;
  try {
    await connectDb();
    const cats = await CategoryModel.find().sort({ displayOrder: 1 }).lean();
    const counts = await ProductModel.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      counts.map((c) => [String(c._id), c.count as number]),
    );
    return NextResponse.json({
      categories: cats.map((c) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
        productCount: countMap.get(String(c._id)) ?? 0,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Categories are unavailable right now." },
      { status: 503 },
    );
  }
}
