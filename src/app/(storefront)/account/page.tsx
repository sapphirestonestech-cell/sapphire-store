import { getCurrentCustomer } from "@/lib/account-session";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata = { title: "Profile · Account" };

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-subheading font-semibold">
        Profile
      </h2>
      <p className="mt-1 mb-6 text-body text-muted">
        Your name, contact details and default display currency.
      </p>
      <div className="max-w-lg">
        {customer ? (
          <ProfileForm
            initial={{
              name: customer.name,
              email: customer.email,
              phone: customer.phone ?? "",
              preferredCurrency: customer.preferredCurrency,
            }}
          />
        ) : (
          <p className="text-body text-danger">
            We couldn&apos;t load your profile. Try again shortly.
          </p>
        )}
      </div>
    </section>
  );
}
