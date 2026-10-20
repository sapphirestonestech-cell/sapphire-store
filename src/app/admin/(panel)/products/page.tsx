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
  published: "bg-accent-wash text-primary",
  draft: "bg-border-default text-muted",
  hidden: "bg-border-default text-muted",
};

export default async function AdminProductsPage() {
  const { failed, products } = await loadProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-heading-lg">Products</h1>
          <p className="mt-1 text-body text-muted">
            {products.length} {products.length === 1 ? "ring" : "rings"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center rounded-pill bg-accent px-5 text-body font-medium text-primary shadow-gold-glow"
        >
          Add product
        </Link>
      </div>

      {failed ? (
        <div role="alert" className="rounded-md border border-danger/40 bg-card p-6 shadow-card">
          <p className="text-body text-danger">
            We couldn&apos;t reach the database. Check MONGODB_URI in
            .env.local, then refresh.
          </p>
        </div>
      ) : null}

      {!failed && products.length === 0 ? (
        <div className="rounded-md bg-card p-10 text-center shadow-card">
          <p className="text-subheading">No rings yet</p>
          <p className="mx-auto mt-2 max-w-md text-body text-muted">
            Add your first ring to see it appear in the storefront.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow"
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
              className="flex flex-wrap items-center gap-4 rounded-md bg-card p-4 shadow-card"
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-sm border border-border-subtle bg-app">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt={p.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div aria-hidden="true" className="grid size-full place-items-center text-muted">
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
                    className={`rounded-sm px-2 py-0.5 text-label font-medium ${STATUS_BADGE[p.status] ?? "bg-border-default text-muted"}`}
                  >
                    {p.status}
                  </span>
                  <span className="rounded-sm bg-border-default px-2 py-0.5 text-label font-medium text-muted">
                    {p.availability === "pre_order" ? "Pre-order" : "In stock"}
                  </span>
                </div>
                <p className="mt-1 text-label text-muted">
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
