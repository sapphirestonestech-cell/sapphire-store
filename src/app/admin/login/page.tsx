import { LoginForm } from "@/components/admin/login-form";
import { TAGLINE } from "@/lib/tagline";

export const metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-card bg-pure-white p-8 shadow-card">
        <p className="font-display text-heading-lg">Sapphire</p>
        <h1 className="mt-1 text-body text-soft-taupe">{TAGLINE}</h1>
        <h2 className="mb-6 mt-8 text-subheading font-semibold">Sign in</h2>
        <LoginForm />
      </div>
    </div>
  );
}
