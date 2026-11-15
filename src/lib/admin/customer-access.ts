import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { canRemoveAdmin } from "@/lib/admin/admins";
import { OrderModel } from "@/lib/models/order";
import { CustomerModel } from "@/lib/models/customer";
import { AdminUserModel } from "@/lib/models/settings";

/**
 * Back-office access for storefront customers — client decision 2026-11-15.
 *
 * A customer is promoted by creating a linked `AdminUser` row that reuses the
 * customer's email and password hash, so the same storefront credentials (or
 * Google sign-in) open the back office. Revoking deletes that linked row and
 * leaves the storefront account untouched.
 */

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string | null;
  lastLoginAt: string | null;
  orderCount: number;
  isAdmin: boolean;
}

export class CustomerAccessError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "CustomerAccessError";
    this.status = status;
  }
}

/** Order counts are keyed by account id first, then by email for guest orders. */
export function orderCountForCustomer(
  id: string,
  email: string,
  byCustomerId: Map<string, number>,
  byEmail: Map<string, number>,
): number {
  return (
    (byCustomerId.get(id) ?? 0) +
    (byEmail.get(email.trim().toLowerCase()) ?? 0)
  );
}

export function isCustomerAdmin(
  email: string,
  adminEmails: Map<string, string>,
): boolean {
  return adminEmails.has(email.trim().toLowerCase());
}

/**
 * Every storefront account, newest first, with order counts and whether it
 * currently has back-office access.
 */
export async function listCustomers(): Promise<CustomerRow[]> {
  await connectDb();

  const [customers, byIdCounts, byEmailCounts, admins] = await Promise.all([
    CustomerModel.find()
      .sort({ createdAt: -1 })
      .select("name email phone lastLoginAt createdAt")
      .lean(),
    OrderModel.aggregate<{ _id: string; count: number }>([
      { $match: { customerId: { $type: "string", $ne: "" } } },
      { $group: { _id: "$customerId", count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          $or: [
            { customerId: { $exists: false } },
            { customerId: null },
            { customerId: "" },
          ],
        },
      },
      { $group: { _id: { $toLower: "$customer.email" }, count: { $sum: 1 } } },
    ]),
    AdminUserModel.find().select("email role").lean(),
  ]);

  const byCustomerId = new Map(byIdCounts.map((row) => [row._id, row.count]));
  const byEmail = new Map(byEmailCounts.map((row) => [row._id, row.count]));
  const adminEmails = new Map(
    admins.map((admin) => [admin.email.trim().toLowerCase(), admin.role]),
  );

  return customers.map((customer) => ({
    id: String(customer._id),
    name: customer.name,
    email: customer.email,
    phone: customer.phone || null,
    createdAt: customer.createdAt?.toISOString() ?? null,
    lastLoginAt: customer.lastLoginAt?.toISOString() ?? null,
    orderCount: orderCountForCustomer(
      String(customer._id),
      customer.email,
      byCustomerId,
      byEmail,
    ),
    isAdmin: isCustomerAdmin(customer.email, adminEmails),
  }));
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

/**
 * Grant back-office access to a customer. The linked admin row reuses the
 * customer's password hash when they have one; Google-only accounts are still
 * granted and sign in with Google at /admin/login.
 */
export async function grantCustomerAdmin(
  customerId: string,
): Promise<{ id: string; email: string }> {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new CustomerAccessError("Customer not found.", 404);
  }

  await connectDb();
  const customer = await CustomerModel.findById(customerId)
    .select("email passwordHash")
    .lean();
  if (!customer) {
    throw new CustomerAccessError("Customer not found.", 404);
  }

  const existing = await AdminUserModel.findOne({ email: customer.email })
    .select("_id")
    .lean();
  if (existing) {
    throw new CustomerAccessError(
      "This customer already has back-office access.",
      409,
    );
  }

  try {
    const admin = await AdminUserModel.create({
      email: customer.email,
      ...(customer.passwordHash ? { passwordHash: customer.passwordHash } : {}),
      role: "admin",
      customerId: String(customer._id),
    });
    return { id: String(admin._id), email: admin.email };
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new CustomerAccessError(
        "This customer already has back-office access.",
        409,
      );
    }
    throw error;
  }
}

/**
 * Revoke back-office access. The storefront account is never deleted. The same
 * two safety rules as the Admins tab apply: no self-revocation and never the
 * last admin.
 */
export async function revokeCustomerAdmin(
  customerId: string,
  currentAdminId: string,
): Promise<void> {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new CustomerAccessError("Customer not found.", 404);
  }

  await connectDb();
  const customer = await CustomerModel.findById(customerId)
    .select("email")
    .lean();
  if (!customer) {
    throw new CustomerAccessError("Customer not found.", 404);
  }

  const admin = await AdminUserModel.findOne({
    $or: [{ customerId: String(customer._id) }, { email: customer.email }],
  })
    .select("_id")
    .lean();
  if (!admin) {
    throw new CustomerAccessError(
      "This customer doesn't have back-office access.",
      400,
    );
  }

  const count = await AdminUserModel.countDocuments();
  const guard = canRemoveAdmin(String(admin._id), currentAdminId, count);
  if (!guard.allowed) {
    throw new CustomerAccessError(guard.reason);
  }

  await AdminUserModel.deleteOne({ _id: admin._id });
}

/**
 * Keep a promoted customer's back-office password in step with the storefront
 * one. Silent on failure: a password reset must never break because the mirror
 * row could not be updated.
 */
export async function syncLinkedAdminPassword(
  customerId: string,
  passwordHash: string,
): Promise<void> {
  try {
    await connectDb();
    await AdminUserModel.updateOne(
      { customerId },
      { $set: { passwordHash } },
    );
  } catch {
    // Best effort; the customer can still use Google sign-in.
  }
}
