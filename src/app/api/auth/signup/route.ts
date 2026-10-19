import { NextResponse } from "next/server";
import { createCustomer, AccountError } from "@/lib/customers";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * POST /api/auth/signup — create a customer account with email + password.
 * Sign-in afterwards goes through the Auth.js Credentials flow on the client.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const payload = (body ?? {}) as Record<string, unknown>;
  try {
    const customer = await createCustomer({
      name: payload.name,
      email: payload.email,
      password: payload.password,
    });
    // Fire-and-forget: the welcome email must never delay sign-up.
    void sendWelcomeEmail(customer.email, customer.name);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    if (err instanceof AccountError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "We couldn't create your account. Try again shortly." },
      { status: 500 },
    );
  }
}
