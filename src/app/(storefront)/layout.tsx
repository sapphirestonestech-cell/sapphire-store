import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { AnnouncementBar } from "@/components/shell/announcement-bar";
import { Footer } from "@/components/shell/footer";
import { Header, type NavCategory } from "@/components/shell/header";
import { connectDb } from "@/lib/db";
import { CategoryModel } from "@/lib/models/category";

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
      <HeaderWithCategories />
    </Suspense>
  );
}

async function HeaderWithCategories() {
  const categories = await loadNavCategories();
  return <Header categories={categories} />;
}

/** Storefront shell — announcement bar, header, footer (DESIGN.md §7). */
export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <AnnouncementBar />
      <HeaderSlot />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
