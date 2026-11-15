import { connectDb } from "@/lib/db";
import { AdminUserModel } from "@/lib/models/settings";

/**
 * Recipients for new-order alerts — client decision 2026-11-15: every admin
 * account gets a copy. Returns [] if the lookup fails so fulfilment is never
 * blocked by a notification lookup.
 */
export async function listAdminNotificationEmails(): Promise<string[]> {
  try {
    await connectDb();
    const emails = await AdminUserModel.distinct("email");
    return emails
      .map((email) => String(email).trim().toLowerCase())
      .filter((email) => email.length > 0);
  } catch {
    return [];
  }
}
