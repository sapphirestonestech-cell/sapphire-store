import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { TAGLINE } from "@/lib/tagline";

export const metadata = { title: "Reset password" };
export const instant = false;

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-md bg-card p-8 shadow-card">
        <p className="font-sans text-heading-lg">Sapphire</p>
        <p className="mt-1 text-body text-muted">{TAGLINE}</p>
        {children}
      </div>
    </div>
  );
}

async function ResetSlot({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";
  return (
    <>
      <h1 className="mb-2 mt-8 text-subheading font-semibold">
        Choose a new password
      </h1>
      <p className="mb-6 text-body text-muted">
        Your new password replaces the old one immediately.
      </p>
      <ResetPasswordForm token={token} />
    </>
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <CardShell>
          <div className="mt-8 h-48 animate-pulse rounded-md bg-accent-wash" />
        </CardShell>
      }
    >
      <CardShell>
        <ResetSlot searchParams={searchParams} />
      </CardShell>
    </Suspense>
  );
}
