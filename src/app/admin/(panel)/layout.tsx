import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { getAdminIdentity } from "@/lib/admin/auth";

/**
 * Admin panel — protected by session cookie (§6.1). The whole area is a
 * request-time route: it reads auth (cookies) and live database data, so it
 * must never be prerendered. `connection()` opts the segment into dynamic
 * rendering, which also silences the "unstable value while prerendering"
 * warning raised by the session's timestamp check.
 */
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const admin = await getAdminIdentity();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 xl:px-10 xl:py-10">
        {children}
      </main>
    </div>
  );
}
