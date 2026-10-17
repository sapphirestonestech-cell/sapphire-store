"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ImageUploader, type SlotValue } from "@/components/admin/image-uploader";
import { priceIn, formatPrice, type Currency } from "@/lib/currency";

export interface CategoryOption {
  id: string;
  name: string;
}

export interface ProductFormInitial {
  id: string;
  name: string;
  description: string;
  type: string;
  categoryIds: string[];
  shape: string;
  material: string;
  color: string;
  basePrice: number;
  compareAtPrice: number | null;
  availability: string;
  preorderArrivalDate: string | null;
  preorderMaxQty: number | null;
  paymentMode: string;
  depositPercent: number | null;
  freeDelivery: { allLocations: boolean; locationIds: string[] };
  status: string;
  isFeatured: boolean;
  images: SlotValue[];
  sizes: { sizeLabel: string; stockQuantity: number }[];
  seoTitle: string;
  seoDescription: string;
}

export interface DeliveryOption {
  id: string;
  label: string;
}

interface Props {
  categories: CategoryOption[];
  locations: DeliveryOption[];
  initial?: ProductFormInitial;
  /** Current store settings for the live converted-price preview (§6.3). */
  baseCurrency: Currency;
  usdToNgn: number;
}

function Field({
  label,
  htmlFor,
  children,
  hint,
  error,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-body font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-label text-soft-taupe">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-label text-status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg text-warm-ink placeholder:text-soft-taupe focus-visible:outline-2 focus-visible:outline-champagne-gold";
const areaClass =
  "w-full rounded-image border border-hairline bg-pure-white px-4 py-3 text-body-lg text-warm-ink";

/**
 * Product form — ProductReq.md §6.3, DESIGN.md §9. Sections: basic info,
 * specifications, pricing (single entry + live conversion preview),
 * availability, images, publishing.
 */
export function ProductForm({
  categories,
  locations,
  initial,
  baseCurrency,
  usdToNgn,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState(initial?.type ?? "engagement");
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initial?.categoryIds ?? [],
  );
  const [shape, setShape] = useState(initial?.shape ?? "");
  const [material, setMaterial] = useState(initial?.material ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [basePrice, setBasePrice] = useState(
    initial ? String(initial.basePrice) : "",
  );
  const [compareAtPrice, setCompareAtPrice] = useState(
    initial?.compareAtPrice != null ? String(initial.compareAtPrice) : "",
  );
  const [availability, setAvailability] = useState(initial?.availability ?? "in_stock");
  const [preorderArrivalDate, setArrivalDate] = useState(
    initial?.preorderArrivalDate ?? "",
  );
  const [preorderMaxQty, setPreorderMaxQty] = useState(
    initial?.preorderMaxQty != null ? String(initial.preorderMaxQty) : "",
  );
  const [paymentMode, setPaymentMode] = useState(initial?.paymentMode ?? "full");
  const [depositPercent, setDepositPercent] = useState(
    initial?.depositPercent != null ? String(initial.depositPercent) : "30",
  );
  const [freeAllLocations, setFreeAllLocations] = useState(
    initial?.freeDelivery.allLocations ?? false,
  );
  const [freeLocationIds, setFreeLocationIds] = useState<string[]>(
    initial?.freeDelivery.locationIds ?? [],
  );
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [images, setImages] = useState<SlotValue[]>(initial?.images ?? []);
  const [sizes, setSizes] = useState(
    initial?.sizes ?? [{ sizeLabel: "", stockQuantity: 0 }],
  );
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initial?.seoDescription ?? "",
  );
  const [newCategory, setNewCategory] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const otherCurrency: Currency = baseCurrency === "USD" ? "NGN" : "USD";
  const numericPrice = Number(basePrice);
  const preview =
    Number.isFinite(numericPrice) && numericPrice > 0
      ? formatPrice(
          priceIn(numericPrice, baseCurrency, otherCurrency, usdToNgn),
          otherCurrency,
        )
      : null;

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function createCategory() {
    const name = newCategory.trim();
    if (!name) return;
    setCreatingCategory(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "The category could not be created.");
        return;
      }
      setCategoryOptions((prev) => [...prev, { id: data.id!, name }]);
      setCategoryIds((prev) => [...prev, data.id!]);
      setNewCategory("");
    } catch {
      setError("The category could not be created. Try again.");
    } finally {
      setCreatingCategory(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      description,
      type,
      categoryIds,
      shape,
      material,
      color,
      basePrice,
      compareAtPrice: compareAtPrice || null,
      availability,
      preorderArrivalDate: availability === "pre_order" ? preorderArrivalDate : null,
      preorderMaxQty:
        availability === "pre_order" && preorderMaxQty ? preorderMaxQty : null,
      paymentMode: availability === "pre_order" ? paymentMode : "full",
      depositPercent:
        availability === "pre_order" && paymentMode === "deposit"
          ? depositPercent
          : null,
      freeDelivery: {
        allLocations: freeAllLocations,
        locationIds: freeAllLocations ? [] : freeLocationIds,
      },
      status,
      isFeatured,
      images: images.map((img, i) => ({ ...img, position: i + 1 })),
      sizes: sizes.filter((s) => s.sizeLabel.trim()),
      seoTitle,
      seoDescription,
    };

    try {
      const res = await fetch(
        initial ? `/api/admin/products/${initial.id}` : "/api/admin/products",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "The ring could not be saved.");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("The ring could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error ? (
        <div
          role="alert"
          className="rounded-card border border-status-error/40 bg-pure-white p-5 shadow-card"
        >
          <p className="text-body text-status-error">{error}</p>
        </div>
      ) : null}

      {/* Basic info */}
      <section
        aria-labelledby="basic-info-heading"
        className="space-y-5 rounded-card bg-pure-white p-6 shadow-card md:p-8"
      >
        <h2 id="basic-info-heading" className="text-subheading font-semibold">
          Basic info
        </h2>
        <Field label="Name" htmlFor="name">
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Aurelia solitaire"
          />
        </Field>
        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={areaClass}
            placeholder="A short, honest description of the ring."
          />
        </Field>
        <Field label="Type" htmlFor="type">
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            <option value="engagement">Engagement ring</option>
            <option value="female">Female ring</option>
            <option value="male">Male ring</option>
          </select>
        </Field>
        <fieldset className="space-y-2">
          <legend className="text-body font-medium">Categories</legend>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((cat) => {
              const active = categoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  aria-pressed={active}
                  className={[
                    "inline-flex min-h-11 items-center rounded-pill px-4 text-body font-medium transition-colors duration-fast",
                    active
                      ? "bg-gold-wash text-warm-ink shadow-[inset_0_0_0_1px_var(--color-champagne-gold)]"
                      : "border border-hairline bg-pure-white text-warm-ink",
                  ].join(" ")}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Create a new category"
              aria-label="New category name"
              className="h-11 flex-1 rounded-pill border border-hairline bg-pure-white px-4 text-body"
            />
            <button
              type="button"
              onClick={createCategory}
              disabled={creatingCategory || !newCategory.trim()}
              className="inline-flex min-h-11 items-center rounded-pill border border-hairline bg-pure-white px-4 text-body font-medium disabled:bg-pale-sand disabled:text-soft-taupe"
            >
              {creatingCategory ? "Adding…" : "Add"}
            </button>
          </div>
        </fieldset>
      </section>

      {/* Specifications */}
      <section
        aria-labelledby="specs-heading"
        className="space-y-5 rounded-card bg-pure-white p-6 shadow-card md:p-8"
      >
        <h2 id="specs-heading" className="text-subheading font-semibold">
          Specifications
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Shape" htmlFor="shape">
            <input
              id="shape"
              required
              value={shape}
              onChange={(e) => setShape(e.target.value)}
              className={inputClass}
              placeholder="Round"
            />
          </Field>
          <Field label="Material" htmlFor="material">
            <input
              id="material"
              required
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className={inputClass}
              placeholder="Gold plated"
            />
          </Field>
          <Field label="Color" htmlFor="color">
            <input
              id="color"
              required
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={inputClass}
              placeholder="Gold"
            />
          </Field>
        </div>

        <div className="space-y-3">
          <p className="text-body font-medium">Sizes and stock</p>
          {sizes.map((s, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-label text-soft-taupe" htmlFor={`size-${i}`}>
                  Size label
                </label>
                <input
                  id={`size-${i}`}
                  value={s.sizeLabel}
                  onChange={(e) =>
                    setSizes((prev) =>
                      prev.map((row, ri) =>
                        ri === i ? { ...row, sizeLabel: e.target.value } : row,
                      ),
                    )
                  }
                  placeholder="US 6"
                  className="h-11 w-full rounded-pill border border-hairline bg-pure-white px-4 text-body"
                />
              </div>
              <div className="w-28">
                <label
                  className="text-label text-soft-taupe"
                  htmlFor={`stock-${i}`}
                >
                  In stock
                </label>
                <input
                  id={`stock-${i}`}
                  type="number"
                  min={0}
                  value={s.stockQuantity}
                  onChange={(e) =>
                    setSizes((prev) =>
                      prev.map((row, ri) =>
                        ri === i
                          ? { ...row, stockQuantity: Number(e.target.value) }
                          : row,
                      ),
                    )
                  }
                  className="h-11 w-full rounded-pill border border-hairline bg-pure-white px-4 text-body tabular"
                />
              </div>
              {sizes.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setSizes((prev) => prev.filter((_, ri) => ri !== i))
                  }
                  aria-label={`Remove size ${s.sizeLabel || i + 1}`}
                  className="flex h-11 w-11 items-center justify-center text-status-error"
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setSizes((prev) => [...prev, { sizeLabel: "", stockQuantity: 0 }])
            }
            className="inline-flex min-h-11 items-center rounded-pill border border-hairline bg-pure-white px-4 text-body font-medium"
          >
            Add size
          </button>
        </div>
      </section>

      {/* Pricing */}
      <section
        aria-labelledby="pricing-heading"
        className="space-y-5 rounded-card bg-pure-white p-6 shadow-card md:p-8"
      >
        <h2 id="pricing-heading" className="text-subheading font-semibold">
          Pricing
        </h2>
        <p className="text-body text-soft-taupe">
          Enter the price once in {baseCurrency}. The other currency converts
          automatically from the current exchange rate.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={`Price (${baseCurrency})`}
            htmlFor="base-price"
            hint={preview ? `Displays as ${preview}` : undefined}
          >
            <input
              id="base-price"
              required
              inputMode="decimal"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className={`${inputClass} tabular`}
              placeholder={baseCurrency === "USD" ? "45.00" : "72000"}
            />
          </Field>
          <Field
            label={`Compare-at price (${baseCurrency}), optional`}
            htmlFor="compare-at"
            hint="Shows a struck-through “was” price."
          >
            <input
              id="compare-at"
              inputMode="decimal"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              className={`${inputClass} tabular`}
            />
          </Field>
        </div>
      </section>

      {/* Availability */}
      <section
        aria-labelledby="availability-heading"
        className="space-y-5 rounded-card bg-pure-white p-6 shadow-card md:p-8"
      >
        <h2 id="availability-heading" className="text-subheading font-semibold">
          Availability
        </h2>
        <div
          role="group"
          aria-label="Availability"
          className="inline-flex rounded-pill border border-hairline bg-pure-white p-1"
        >
          {[
            { value: "in_stock", label: "In stock" },
            { value: "pre_order", label: "Pre-order" },
          ].map((opt) => {
            const active = availability === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAvailability(opt.value)}
                aria-pressed={active}
                className={[
                  "min-h-10 rounded-pill px-5 text-body font-medium transition-colors duration-fast",
                  active
                    ? "bg-gold-wash text-warm-ink shadow-[inset_0_0_0_1px_var(--color-champagne-gold)]"
                    : "text-soft-taupe",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {availability === "pre_order" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Expected arrival date"
              htmlFor="arrival-date"
              hint="Shown everywhere the ring appears."
            >
              <input
                id="arrival-date"
                type="date"
                required
                value={preorderArrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Maximum pre-order quantity, optional"
              htmlFor="preorder-max"
            >
              <input
                id="preorder-max"
                type="number"
                min={1}
                value={preorderMaxQty}
                onChange={(e) => setPreorderMaxQty(e.target.value)}
                className={`${inputClass} tabular`}
              />
            </Field>
          </div>
        ) : null}

        {availability === "pre_order" ? (
          <fieldset className="space-y-3">
            <legend className="text-body font-medium">Pre-order payment</legend>
            <div
              role="group"
              aria-label="Pre-order payment mode"
              className="inline-flex rounded-pill border border-hairline bg-pure-white p-1"
            >
              {[
                { value: "full", label: "Pay in full" },
                { value: "deposit", label: "Deposit" },
              ].map((opt) => {
                const active = paymentMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMode(opt.value)}
                    aria-pressed={active}
                    className={[
                      "min-h-10 rounded-pill px-5 text-body font-medium transition-colors duration-fast",
                      active
                        ? "bg-gold-wash text-warm-ink shadow-[inset_0_0_0_1px_var(--color-champagne-gold)]"
                        : "text-soft-taupe",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {paymentMode === "deposit" ? (
              <Field
                label="Deposit percentage"
                htmlFor="deposit-percent"
                hint="The rest is due before the ring ships."
              >
                <input
                  id="deposit-percent"
                  type="number"
                  min={1}
                  max={99}
                  required
                  value={depositPercent}
                  onChange={(e) => setDepositPercent(e.target.value)}
                  className={`${inputClass} tabular`}
                />
              </Field>
            ) : null}
          </fieldset>
        ) : null}
      </section>

      {/* Free delivery */}
      <section
        aria-labelledby="free-delivery-heading"
        className="space-y-5 rounded-card bg-pure-white p-6 shadow-card md:p-8"
      >
        <h2 id="free-delivery-heading" className="text-subheading font-semibold">
          Free delivery
        </h2>
        <p className="text-body text-soft-taupe">
          Offer this ring free delivery, everywhere or only to chosen locations.
        </p>
        <label className="inline-flex min-h-11 items-center gap-3 text-body">
          <input
            type="checkbox"
            checked={freeAllLocations}
            onChange={(e) => setFreeAllLocations(e.target.checked)}
            className="size-5 accent-champagne-gold"
          />
          Free delivery to all locations
        </label>

        {!freeAllLocations ? (
          locations.length === 0 ? (
            <p className="text-body text-soft-taupe">
              No delivery locations yet. Add them under Delivery.
            </p>
          ) : (
            <fieldset className="space-y-2">
              <legend className="text-body font-medium">
                Free delivery to these locations
              </legend>
              <div className="flex flex-wrap gap-2">
                {locations.map((loc) => {
                  const active = freeLocationIds.includes(loc.id);
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setFreeLocationIds((prev) =>
                          active
                            ? prev.filter((x) => x !== loc.id)
                            : [...prev, loc.id],
                        )
                      }
                      className={[
                        "inline-flex min-h-11 items-center rounded-pill px-4 text-body font-medium transition-colors duration-fast",
                        active
                          ? "bg-gold-wash text-warm-ink shadow-[inset_0_0_0_1px_var(--color-champagne-gold)]"
                          : "border border-hairline bg-pure-white text-warm-ink",
                      ].join(" ")}
                    >
                      {loc.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )
        ) : null}
      </section>

      {/* Images */}
      <section
        aria-labelledby="images-heading"
        className="space-y-5 rounded-card bg-pure-white p-6 shadow-card md:p-8"
      >
        <h2 id="images-heading" className="text-subheading font-semibold">
          Images
        </h2>
        <ImageUploader value={images} onChange={setImages} />
      </section>

      {/* Publishing */}
      <section
        aria-labelledby="publishing-heading"
        className="space-y-5 rounded-card bg-pure-white p-6 shadow-card md:p-8"
      >
        <h2 id="publishing-heading" className="text-subheading font-semibold">
          Publishing
        </h2>
        <Field label="Status" htmlFor="status">
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </Field>
        <label className="inline-flex min-h-11 items-center gap-3 text-body">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="size-5 accent-champagne-gold"
          />
          Feature this ring on the homepage
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Meta title, optional" htmlFor="seo-title">
            <input
              id="seo-title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Meta description, optional" htmlFor="seo-description">
            <input
              id="seo-description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow disabled:bg-pale-sand disabled:text-soft-taupe disabled:shadow-none"
        >
          {saving
            ? "Saving…"
            : initial
              ? "Save changes"
              : status === "published"
                ? "Publish ring"
                : "Save ring"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="inline-flex min-h-12 items-center rounded-pill border border-hairline bg-pure-white px-6 text-body-lg font-medium text-warm-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
