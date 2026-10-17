import Link from "next/link";
import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { ProductModel } from "@/lib/models/product";
import { CategoryModel } from "@/lib/models/category";
import { ProductActions } from "@/components/admin/product-actions";

export const metadata = { title: "Products" };

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  availability: string;
  status: string;
  basePrice: number;
  image: string;
  categoryName: string;
  arrival: string | null;
}

async function loadProducts(): Promise<{ failed: boolean; products: ProductRow[] }> {
  try {
    await connection();
    await connectDb();
    const [products, categories] = await Promise.all([
      ProductModel.find()
        .sort({ createdAt: -1 })
        .lean(),
      CategoryModel.find().sort({ displayOrder: 1 }).lean(),
    ]);
    const categoryName = new Map(
      categories.map((c) => [String(c._id), c.name]),
    );
    return {
      failed: false,
      products: products.map((p) => ({
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        type: p.type,
        availability: p.availability,
        status: p.status,
        basePrice: p.basePrice,
        image: p.images[0]?.url ?? "",
        categoryName:
          p.categories
            .map((c) => categoryName.get(String(c)) ?? "")
            .filter(Boolean)
            .join(", ") || "Uncategorized",
        arrival: p.preorderArrivalDate
          ? new Date(p.preorderArrivalDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : null,
      })),
    };
  } catch {
    return { failed: true, products: [] };
  }
}

const STATUS_BADGE: Record<string, string> = {
  published: "bg-gold-wash text-warm-ink",
  draft: "bg-pale-sand text-soft-taupe",
  hidden: "bg-pale-sand text-soft-taupe",
};

export default async function AdminProductsPage() {
  const { failed, products } = await loadProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-heading-lg">Products</h1>
          <p className="mt-1 text-body text-soft-taupe">
            {products.length} {products.length === 1 ? "ring" : "rings"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center rounded-pill bg-champagne-gold px-5 text-body font-medium text-warm-ink shadow-gold-glow"
        >
          Add product
        </Link>
      </div>

      {failed ? (
        <div role="alert" className="rounded-card border border-status-error/40 bg-pure-white p-6 shadow-card">
          <p className="text-body text-status-error">
            We couldn&apos;t reach the database. Check MONGODB_URI in
            .env.local, then refresh.
          </p>
        </div>
      ) : null}

      {!failed && products.length === 0 ? (
        <div className="rounded-card bg-pure-white p-10 text-center shadow-card">
          <p className="text-subheading">No rings yet</p>
          <p className="mx-auto mt-2 max-w-md text-body text-soft-taupe">
            Add your first ring to see it appear in the storefront.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow"
          >
            Add product
          </Link>
        </div>
      ) : null}

      {products.length > 0 ? (
        <ul className="space-y-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-4 rounded-card bg-pure-white p-4 shadow-card"
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-image border border-hairline bg-ivory-canvas">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt={p.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div aria-hidden="true" className="grid size-full place-items-center text-soft-taupe">
                    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.4}>
                      <circle cx="12" cy="14" r="5" />
                      <path d="M12 5l2.5 3L12 11 9.5 8 12 5z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-body-lg font-medium hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span
                    className={`rounded-chip-label px-2 py-0.5 text-label font-medium ${STATUS_BADGE[p.status] ?? "bg-pale-sand text-soft-taupe"}`}
                  >
                    {p.status}
                  </span>
                  <span className="rounded-chip-label bg-pale-sand px-2 py-0.5 text-label font-medium text-soft-taupe">
                    {p.availability === "pre_order" ? "Pre-order" : "In stock"}
                  </span>
                </div>
                <p className="mt-1 text-label text-soft-taupe">
                  {p.categoryName} · {p.type}
                  {p.arrival ? ` · arrives ${p.arrival}` : ""}
                </p>
              </div>

              <p className="text-body-lg font-medium tabular">
                ${p.basePrice.toFixed(2)}
              </p>

              <ProductActions id={p.id} name={p.name} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
