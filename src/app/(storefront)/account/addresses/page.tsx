import { getCurrentCustomer } from "@/lib/account-session";
import { getDeliveryLocations } from "@/lib/settings";
import { connectDb } from "@/lib/db";
import { AddressModel } from "@/lib/models/customer";
import { AddressesManager, type AddressView } from "@/components/account/addresses-manager";

export const metadata = { title: "Addresses · Account" };

async function loadAddresses(customerId: string): Promise<AddressView[]> {
  try {
    await connectDb();
    const docs = await AddressModel.find({ customerId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    return docs.map((d) => ({
      id: String(d._id),
      label: d.label,
      line1: d.line1,
      line2: d.line2 || undefined,
      locationId: String(d.locationId),
      phone: d.phone || undefined,
      isDefault: d.isDefault,
    }));
  } catch {
    return [];
  }
}

export default async function AccountAddressesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return (
      <section>
        <h2 className="text-subheading font-semibold">Addresses</h2>
        <p className="mt-2 text-body text-muted">
          Sign in to manage your saved addresses.
        </p>
      </section>
    );
  }

  const [addresses, locations] = await Promise.all([
    loadAddresses(customer.id),
    getDeliveryLocations(),
  ]);

  return (
    <section aria-labelledby="addresses-heading">
      <h2 id="addresses-heading" className="text-subheading font-semibold">
        Addresses
      </h2>
      <p className="mt-1 mb-6 text-body text-muted">
        Save the places you deliver to most. Delivery fees are set per location.
      </p>
      <AddressesManager
        initialAddresses={addresses}
        locations={locations.map((l) => ({ id: l.id, label: l.label }))}
      />
    </section>
  );
}
