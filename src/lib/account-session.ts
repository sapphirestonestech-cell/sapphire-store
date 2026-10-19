import { auth } from "@/auth";
import { getCustomerById, type PublicCustomer } from "@/lib/customers";

/**
 * Resolve the signed-in customer from the Auth.js session, or null.
 * Used by account API routes and server components.
 */
export async function getCurrentCustomer(): Promise<PublicCustomer | null> {
  const session = await auth();
  const id = session?.user?.customerId;
  if (!id) return null;
  return getCustomerById(id);
}

/** Like getCurrentCustomer but throws a 401-shaped error when signed out. */
export async function requireCustomerId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.customerId ?? null;
}
