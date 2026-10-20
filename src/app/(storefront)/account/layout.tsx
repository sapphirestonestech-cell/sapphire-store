import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentCustomer } from "@/lib/account-session";
import { AccountNav } from "@/components/account/account-nav";

export const metadata = { title: "My account" };
export const instant = false;

async function AccountGuard({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.customerId) {
    redirect("/sign-in?callbackUrl=/account");
  }
  return <>{children}</>;
}

async function AccountHeader() {
  const customer = await getCurrentCustomer();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-sans text-heading-lg text-primary">
          {customer?.name ?? "My account"}
        </h1>
        <p className="mt-1 text-body text-muted">{customer?.email}</p>
      </div>
    </div>
  );
}

export default function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="page-width py-8 md:py-12">
      <AccountGuard>
        <Suspense
          fallback={<div className="h-24 animate-pulse rounded-md bg-accent-wash" />}
        >
          <AccountHeader />
        </Suspense>
        <div className="mt-8 grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-8">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </AccountGuard>
    </div>
  );
}
