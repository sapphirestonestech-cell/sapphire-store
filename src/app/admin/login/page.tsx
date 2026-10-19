import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { googleEnabled } from "@/auth";
import { TAGLINE } from "@/lib/tagline";

export const metadata = { title: "Admin sign in" };

type SearchParams = Promise<{ error?: string }>;

async function LoginFormWithParams({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialError =
    params.error === "not-admin"
      ? "This Google account doesn't have admin access."
      : null;
  return (
    <LoginForm googleEnabled={googleEnabled} initialError={initialError} />
  );
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-card bg-pure-white p-8 shadow-card">
        <p className="font-display text-heading-lg">Sapphire</p>
        <h1 className="mt-1 text-body text-soft-taupe">{TAGLINE}</h1>
        <h2 className="mb-6 mt-8 text-subheading font-semibold">Sign in</h2>
        <Suspense fallback={<LoginForm googleEnabled={googleEnabled} />}>
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
