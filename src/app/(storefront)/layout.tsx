import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { AnnouncementBar } from "@/components/shell/announcement-bar";
import { Footer } from "@/components/shell/footer";
import { Header, type NavCategory, type HeaderUser } from "@/components/shell/header";
import { SignedInProvider } from "@/components/signed-in-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
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
        <header className="sticky top-0 z-40 bg-card">
          <div className="page-width flex h-16 items-center md:h-20">
            <span className="font-sans text-heading-lg">Sapphire</span>
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

/**
 * Resolves only whether a storefront customer is signed in, kept separate from
 * the header (which may stream later) so the wishlist provider and hearts
 * have sign-in state without blocking on the nav categories.
 */
async function SignedInSlot() {
  try {
    const session = await auth();
    return Boolean(session?.user?.customerId);
  } catch {
    return false;
  }
}

/** Storefront shell — announcement bar, header, footer (DESIGN.md §7). */
export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const signedIn = await SignedInSlot();
  return (
    <SignedInProvider signedIn={signedIn}>
      <WishlistProvider>
        <div className="relative flex min-h-full flex-col">
          <AnnouncementBar />
          <HeaderSlot />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </WishlistProvider>
    </SignedInProvider>
  );
}
