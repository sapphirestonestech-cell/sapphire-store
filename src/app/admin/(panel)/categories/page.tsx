import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { CategoryModel } from "@/lib/models/category";
import { ProductModel } from "@/lib/models/product";
import {
  CategoriesManager,
  type CategoryRow,
} from "@/components/admin/categories-manager";

export const metadata = { title: "Categories" };

async function loadCategories(): Promise<{
  failed: boolean;
  rows: CategoryRow[];
}> {
  try {
    await connection();
    await connectDb();
    const [cats, counts] = await Promise.all([
      CategoryModel.find().sort({ displayOrder: 1 }).lean(),
      ProductModel.aggregate([
        { $unwind: "$categories" },
        { $group: { _id: "$categories", count: { $sum: 1 } } },
      ]),
    ]);
    const countMap = new Map(
      counts.map((c) => [String(c._id), c.count as number]),
    );
    return {
      failed: false,
      rows: cats.map((c) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
        productCount: countMap.get(String(c._id)) ?? 0,
      })),
    };
  } catch {
    return { failed: true, rows: [] };
  }
}

export default async function AdminCategoriesPage() {
  const { failed, rows } = await loadCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-heading-lg">Categories</h1>
        <p className="mt-1 text-body text-muted">
          Rings can sit in more than one category. Deleting a category keeps
          its rings.
        </p>
      </div>

      {failed ? (
        <div role="alert" className="rounded-md border border-danger/40 bg-card p-6 shadow-card">
          <p className="text-body text-danger">
            We couldn&apos;t reach the database. Check MONGODB_URI in
            .env.local, then refresh.
          </p>
        </div>
      ) : null}

      {!failed ? <CategoriesManager initial={rows} /> : null}
    </div>
  );
}
