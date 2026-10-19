import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { AnnouncementBar } from "@/components/shell/announcement-bar";
import { Footer } from "@/components/shell/footer";
import { Header, type NavCategory, type HeaderUser } from "@/components/shell/header";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { CategoryModel } from "@/lib/models/category";
import { AdminUserModel } from "@/lib/models/settings";
import { getSession } from "@/lib/session";

async function loadNavCategories(): Promise<NavCategory[]> {
  try {
    await connection();
    await connectDb();
    const cats = await CategoryModel.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .select("slug name")
      .lean();
    return cats.map((c) => ({ slug: c.slug, name: c.name }));
  } catch {
    return [];
  }
}

async function loadHeaderUser(): Promise<HeaderUser | null> {
  try {
    const [session, adminSession] = await Promise.all([
      auth(),
      getSession(),
    ]);
    const isCustomer = Boolean(session?.user?.customerId);
    if (!isCustomer && !adminSession) return null;

    let isAdmin = Boolean(adminSession);
    if (isCustomer && !isAdmin && session?.user?.email) {
      try {
        await connectDb();
        const admin = await AdminUserModel.findOne({
          email: session.user.email.trim().toLowerCase(),
        })
          .select("_id")
          .lean();
        isAdmin = admin != null;
      } catch {
        isAdmin = false;
      }
    }

    return {
      name:
        session?.user?.name ?? (isAdmin && !isCustomer ? "Admin" : null),
      isAdmin,
      isCustomer,
    };
  } catch {
    return null;
  }
}

function HeaderSlot() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 bg-pure-white">
          <div className="page-width flex h-16 items-center md:h-20">
            <span className="font-display text-heading-lg">Sapphire</span>
          </div>
        </header>
      }
    >
      <HeaderWithData />
    </Suspense>
  );
}

async function HeaderWithData() {
  const [categories, user] = await Promise.all([
    loadNavCategories(),
    loadHeaderUser(),
  ]);
  return <Header categories={categories} user={user} />;
}

/** Storefront shell — announcement bar, header, footer (DESIGN.md §7). */
export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col">
      <AnnouncementBar />
      <HeaderSlot />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
