import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { TAGLINE } from "@/lib/tagline";

export const metadata = { title: "Sign in" };
export const instant = false;

function safeCallbackUrl(raw: unknown): string {
  // Only same-origin paths; prevents open-redirect via ?callbackUrl=.
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/account";
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-card bg-pure-white p-8 shadow-card">
        <p className="font-display text-heading-lg">Sapphire</p>
        <p className="mt-1 text-body text-soft-taupe">{TAGLINE}</p>
        {children}
      </div>
    </div>
  );
}

async function SignInSlot({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (session?.user?.customerId) redirect("/account");
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params?.callbackUrl);
  return (
    <>
      <h1 className="mb-6 mt-8 text-subheading font-semibold">Sign in</h1>
      <SignInForm googleEnabled={googleEnabled} callbackUrl={callbackUrl} />
    </>
  );
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <CardShell>
          <div className="mt-8 h-64 animate-pulse rounded-card bg-gold-wash" />
        </CardShell>
      }
    >
      <CardShell>
        <SignInSlot searchParams={searchParams} />
      </CardShell>
    </Suspense>
  );
}
