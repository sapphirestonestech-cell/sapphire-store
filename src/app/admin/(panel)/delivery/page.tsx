import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { DeliveryLocationModel } from "@/lib/models/settings";
import {
  DeliveryManager,
  type DeliveryRow,
} from "@/components/admin/delivery-manager";

export const metadata = { title: "Delivery" };

async function loadLocations(): Promise<{ failed: boolean; rows: DeliveryRow[] }> {
  try {
    await connection();
    await connectDb();
    const docs = await DeliveryLocationModel.find()
      .sort({ country: 1, cityArea: 1 })
      .lean();
    return {
      failed: false,
      rows: docs.map((d) => ({
        id: String(d._id),
        country: d.country,
        region: d.region ?? "",
        cityArea: d.cityArea,
        instockFee: d.instockFee,
        preorderFee: d.preorderFee,
        minDays: d.minDays,
        maxDays: d.maxDays,
        isActive: d.isActive,
      })),
    };
  } catch {
    return { failed: true, rows: [] };
  }
}

export default async function AdminDeliveryPage() {
  const { failed, rows } = await loadLocations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-heading-lg">Delivery</h1>
        <p className="mt-1 text-body text-muted">
          Fees are in your base currency. In-stock and pre-order rings have their
          own fee and delivery days.
        </p>
      </div>

      {failed ? (
        <div
          role="alert"
          className="rounded-md border border-danger/40 bg-card p-6 shadow-card"
        >
          <p className="text-body text-danger">
            We couldn&apos;t reach the database. Check MONGODB_URI in .env.local,
            then refresh.
          </p>
        </div>
      ) : null}

      {!failed ? <DeliveryManager initial={rows} /> : null}
    </div>
  );
}
