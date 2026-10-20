import { notFound } from "next/navigation";
import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { ProductModel } from "@/lib/models/product";
import { CategoryModel } from "@/lib/models/category";
import { DeliveryLocationModel } from "@/lib/models/settings";
import { getSettings } from "@/lib/settings";
import { ProductForm, type ProductFormInitial } from "@/components/admin/product-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  let initial: ProductFormInitial | null = null;
  let categories: { id: string; name: string }[] = [];
  let locations: { id: string; label: string }[] = [];
  let baseCurrency: "USD" | "NGN" = "USD";
  let usdToNgn = 1600;
  let failed = false;

  try {
    await connection();
    await connectDb();
    const [doc, cats, locDocs, settings] = await Promise.all([
      ProductModel.findById(id).lean(),
      CategoryModel.find().sort({ displayOrder: 1 }).lean(),
      DeliveryLocationModel.find({ isActive: true })
        .sort({ country: 1, cityArea: 1 })
        .lean(),
      getSettings(),
    ]);
    if (!doc) notFound();
    categories = cats.map((c) => ({ id: String(c._id), name: c.name }));
    locations = locDocs.map((d) => ({
      id: String(d._id),
      label: d.region
        ? `${d.cityArea}, ${d.region}, ${d.country}`
        : `${d.cityArea}, ${d.country}`,
    }));
    baseCurrency = settings.baseCurrency;
    usdToNgn = settings.usdToNgn;
    initial = {
      id: String(doc._id),
      name: doc.name,
      description: doc.description ?? "",
      type: doc.type,
      categoryIds: doc.categories.map((c) => String(c)),
      shape: doc.shape,
      material: doc.material,
      color: doc.color,
      basePrice: doc.basePrice,
      compareAtPrice: doc.compareAtPrice ?? null,
      availability: doc.availability,
      preorderArrivalDate: doc.preorderArrivalDate
        ? new Date(doc.preorderArrivalDate).toISOString().slice(0, 10)
        : null,
      preorderMaxQty: doc.preorderMaxQty ?? null,
      paymentMode: doc.paymentMode ?? "full",
      depositPercent:
        doc.availability === "pre_order" && doc.paymentMode === "deposit"
          ? (doc.depositPercent ?? null)
          : null,
      freeDelivery: {
        allLocations: doc.freeDelivery?.allLocations ?? false,
        locationIds: (doc.freeDelivery?.locationIds ?? []).map(String),
      },
      status: doc.status,
      isFeatured: doc.isFeatured,
      images: doc.images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
        label: img.label ?? "",
      })),
      sizes: doc.sizes.map((s) => ({
        sizeLabel: s.sizeLabel,
        stockQuantity: s.stockQuantity,
      })),
      seoTitle: doc.seoTitle ?? "",
      seoDescription: doc.seoDescription ?? "",
    };
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    failed = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-heading-lg">Edit product</h1>
        <p className="mt-1 text-body text-muted">
          Changes appear in the storefront as soon as you save.
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

      {initial ? (
        <ProductForm
          categories={categories}
          locations={locations}
          initial={initial}
          baseCurrency={baseCurrency}
          usdToNgn={usdToNgn}
        />
      ) : null}
    </div>
  );
}
