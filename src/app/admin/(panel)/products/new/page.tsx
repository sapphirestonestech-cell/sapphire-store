import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { CategoryModel } from "@/lib/models/category";
import { DeliveryLocationModel } from "@/lib/models/settings";
import { getSettings } from "@/lib/settings";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  let locations: { id: string; label: string }[] = [];
  let baseCurrency: "USD" | "NGN" = "USD";
  let usdToNgn = 1600;
  let failed = false;

  try {
    await connection();
    await connectDb();
    const [cats, locDocs, settings] = await Promise.all([
      CategoryModel.find().sort({ displayOrder: 1 }).lean(),
      DeliveryLocationModel.find({ isActive: true })
        .sort({ country: 1, cityArea: 1 })
        .lean(),
      getSettings(),
    ]);
    categories = cats.map((c) => ({ id: String(c._id), name: c.name }));
    locations = locDocs.map((d) => ({
      id: String(d._id),
      label: d.region
        ? `${d.cityArea}, ${d.region}, ${d.country}`
        : `${d.cityArea}, ${d.country}`,
    }));
    baseCurrency = settings.baseCurrency;
    usdToNgn = settings.usdToNgn;
  } catch {
    failed = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-heading-lg">Add product</h1>
        <p className="mt-1 text-body text-muted">
          Up to four images, categories, and in-stock or pre-order settings.
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

      <ProductForm
        categories={categories}
        locations={locations}
        baseCurrency={baseCurrency}
        usdToNgn={usdToNgn}
      />
    </div>
  );
}
