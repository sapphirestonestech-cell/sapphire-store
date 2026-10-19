import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { CustomerModel } from "@/lib/models/customer";
import { EMAIL_RE } from "@/lib/customers";
import { sendWelcomeEmail } from "@/lib/email";
import {
  checkLoginAllowed,
  recordFailedLogin,
  clearLoginAttempts,
} from "@/lib/rate-limit";

/**
 * Customer authentication — Auth.js (NextAuth) v5, JWT sessions.
 * Email + password via Credentials; Google OAuth when configured.
 * Admin auth stays on the separate HMAC cookie (src/lib/session.ts).
 */

declare module "next-auth" {
  interface Session {
    user: {
      customerId: string;
    } & DefaultSession["user"];
  }
  interface User {
    customerId?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    customerId?: string;
  }
}

export const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";
        if (!email || !EMAIL_RE.test(email) || !password) return null;

        const limitKey = `customer-login:${email}`;
        if (!checkLoginAllowed(limitKey).allowed) return null;

        await connectDb();
        const customer = await CustomerModel.findOne({ email }).lean();
        const hash = customer?.passwordHash;
        const ok =
          hash != null && (await bcrypt.compare(password, hash));
        if (!ok || !customer) {
          recordFailedLogin(limitKey);
          return null;
        }
        clearLoginAttempts(limitKey);
        return {
          id: String(customer._id),
          customerId: String(customer._id),
          name: customer.name,
          email: customer.email,
          image: customer.image ?? null,
        };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
  ],
  callbacks: {
    /**
     * Find or create the Customer record for a Google sign-in, keyed by
     * the Google-verified email. If a password account already exists with
     * that email, it is reused (linked) rather than duplicated.
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      const email = user.email?.trim().toLowerCase();
      if (!email || !EMAIL_RE.test(email)) return false;
      try {
        await connectDb();
        const customer = await CustomerModel.findOne({ email }).lean();
        if (!customer) {
          const created = await CustomerModel.create({
            name: user.name?.trim() || email,
            email,
            image: user.image ?? undefined,
          });
          user.customerId = String(created._id);
          // Fire-and-forget: never delay Google sign-in on the welcome email.
          void sendWelcomeEmail(email, created.name);
          return true;
        }
        user.customerId = String(customer._id);
        // Refresh the stored name/image if Google has them.
        await CustomerModel.updateOne(
          { _id: customer._id },
          {
            $set: {
              ...(user.name ? { name: user.name } : {}),
              ...(user.image ? { image: user.image } : {}),
            },
          },
        );
        return true;
      } catch {
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.customerId) token.customerId = user.customerId;
      return token;
    },
    async session({ session, token }) {
      if (token.customerId) session.user.customerId = token.customerId;
      return session;
    },
  },
});
