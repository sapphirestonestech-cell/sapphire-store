import { cookies } from "next/headers";
import { DATA_SCOPE_COOKIE, parseDataScope, type DataScope } from "@/lib/admin/data-scope";

/** Read the admin's chosen data scope from its cookie (server only). */
export async function getAdminDataScope(): Promise<DataScope> {
  const store = await cookies();
  return parseDataScope(store.get(DATA_SCOPE_COOKIE)?.value);
}
