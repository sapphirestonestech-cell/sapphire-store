import Link from "next/link";
import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { ProductModel } from "@/lib/models/product";
import { CategoryModel } from "@/lib/models/category";

export const metadata = { title: "Dashboard" };

async function loadStats() {
  try {
    await connection();
    await connectDb();
    const [published, drafts, preorders, categories] = await Promise.all([
      ProductModel.countDocuments({ status: "published" }),
      ProductModel.countDocuments({ status: "draft" }),
      ProductModel.countDocuments({
        status: "published",
        availability: "pre_order",
      }),
      CategoryModel.countDocuments({ isActive: true }),
    ]);
    return { published, drafts, preorders, categories, failed: false };
  } catch {
    return { published: 0, drafts: 0, preorders: 0, categories: 0, failed: true };
  }
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-card bg-pure-white p-6 shadow-card">
      <p className="text-heading-lg font-semibold tabular">{value}</p>
      <p className="mt-1 text-body text-soft-taupe">{label}</p>
      {hint ? <p className="mt-2 text-label text-soft-taupe">{hint}</p> : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await loadStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-heading-lg">Dashboard</h1>
          <p className="mt-1 text-body text-soft-taupe">
            Your store at a glance.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center rounded-pill bg-champagne-gold px-5 text-body font-medium text-warm-ink shadow-gold-glow"
        >
          Add product
        </Link>
      </div>

      {stats.failed ? (
        <div role="alert" className="rounded-card border border-status-error/40 bg-pure-white p-6 shadow-card">
          <p className="text-body text-status-error">
            We couldn&apos;t reach the database. Check MONGODB_URI in
            .env.local, then refresh.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Published rings" value={stats.published} />
        <StatCard
          label="Pre-orders"
          value={stats.preorders}
          hint="Rings customers can reserve before arrival"
        />
        <StatCard label="Drafts" value={stats.drafts} />
        <StatCard label="Active categories" value={stats.categories} />
      </div>

      <div className="rounded-card bg-pure-white p-6 shadow-card">
        <h2 className="text-subheading font-semibold">Quick actions</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          <li>
            <Link
              href="/admin/products/new"
              className="inline-flex min-h-11 items-center rounded-pill border border-hairline bg-pure-white px-5 text-body font-medium"
            >
              Add product
            </Link>
          </li>
          <li>
            <Link
              href="/admin/categories"
              className="inline-flex min-h-11 items-center rounded-pill border border-hairline bg-pure-white px-5 text-body font-medium"
            >
              Manage categories
            </Link>
          </li>
          <li>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-pill border border-hairline bg-pure-white px-5 text-body font-medium"
            >
              View storefront
            </Link>
          </li>
        </ul>
        <p className="mt-5 text-body text-soft-taupe">
          Exchange rate, delivery locations, orders and payments arrive in the
          commerce phase.
        </p>
      </div>
    </div>
  );
}
