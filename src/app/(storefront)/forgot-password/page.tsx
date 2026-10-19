import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { TAGLINE } from "@/lib/tagline";

export const metadata = { title: "Forgot password" };
export const instant = false;

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-card bg-pure-white p-8 shadow-card">
        <p className="font-display text-heading-lg">Sapphire</p>
        <p className="mt-1 text-body text-soft-taupe">{TAGLINE}</p>
        <h1 className="mb-2 mt-8 text-subheading font-semibold">
          Forgot your password?
        </h1>
        <p className="mb-6 text-body text-soft-taupe">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
