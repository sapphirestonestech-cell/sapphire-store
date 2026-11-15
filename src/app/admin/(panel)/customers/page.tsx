import { connection } from "next/server";
import { getAdminIdentity } from "@/lib/admin/auth";
import { listCustomers, type CustomerRow } from "@/lib/admin/customer-access";
import { CustomersManager } from "@/components/admin/customers-manager";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  await connection();

  let failed = false;
  let rows: CustomerRow[] = [];
  try {
    rows = await listCustomers();
  } catch {
    failed = true;
  }
  const admin = await getAdminIdentity();
  const adminCount = rows.filter((row) => row.isAdmin).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-heading-lg">Customers</h1>
        <p className="mt-1 text-body text-muted">
          {failed
            ? "Storefront accounts couldn’t be loaded."
            : `${rows.length} ${rows.length === 1 ? "account" : "accounts"} · ${adminCount} with back-office access`}
        </p>
        <p className="mt-2 max-w-2xl text-body text-muted">
          Granting back-office access reuses the customer&apos;s own storefront
          login. Revoking it leaves their account and orders untouched.
        </p>
      </div>

      {failed ? (
        <div
          role="alert"
          className="rounded-md border border-danger/40 bg-card p-6 shadow-card"
        >
          <p className="text-body text-danger">
            We couldn&apos;t load storefront accounts. Check MONGODB_URI in
            .env.local, then refresh.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md bg-card p-10 text-center shadow-card">
          <p className="text-subheading">No customer accounts yet</p>
          <p className="mx-auto mt-2 max-w-md text-body text-muted">
            Accounts appear here when someone signs up on the storefront. Guest
            checkouts don&apos;t create an account.
          </p>
        </div>
      ) : (
        <CustomersManager
          initial={rows}
          currentAdminEmail={admin?.email ?? ""}
        />
      )}
    </div>
  );
}
