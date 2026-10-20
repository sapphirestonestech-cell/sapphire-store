import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { TAGLINE } from "@/lib/tagline";

export const metadata = { title: "Create account" };
export const instant = false;

function safeCallbackUrl(raw: unknown): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/account";
}

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

async function SignUpSlot({
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
      <h1 className="mb-6 mt-8 text-subheading font-semibold">
        Create an account
      </h1>
      <SignUpForm googleEnabled={googleEnabled} callbackUrl={callbackUrl} />
    </>
  );
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <CardShell>
          <div className="mt-8 h-64 animate-pulse rounded-md bg-accent-wash" />
        </CardShell>
      }
    >
      <CardShell>
        <SignUpSlot searchParams={searchParams} />
      </CardShell>
    </Suspense>
  );
}
