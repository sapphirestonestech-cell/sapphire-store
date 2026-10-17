import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function RedirectToShop({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<ReactNode> {
  const resolved = await searchParams;
  const raw = resolved.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  redirect(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
}

/**
 * Search results reuse the shop explorer (§5.4) — same cards, same filters.
 * `searchParams` is read inside a Suspense boundary so the shell can still
 * be prerendered under cacheComponents.
 */
export default function SearchRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={null}>
      <RedirectToShop searchParams={searchParams} />
    </Suspense>
  );
}
