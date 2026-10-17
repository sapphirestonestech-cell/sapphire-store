import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { getSession } from "@/lib/session";

/**
 * Admin panel — protected by session cookie (§6.1). The whole area is a
 * blocking route: it reads auth (cookies) and live database data, and must
 * never be prerendered or cached, so `instant = false` is intentional.
 */
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-ivory-canvas">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
