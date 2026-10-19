"use client";

import { signIn } from "next-auth/react";

/** Google sign-in button — shown only when the Google provider is configured. */
export function GoogleSignInButton({ callbackUrl = "/account" }: { callbackUrl?: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-pill border border-hairline bg-pure-white px-8 text-body-lg font-medium text-warm-ink transition-colors duration-fast hover:bg-gold-wash"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.6z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1L1.2 17c2 3.7 5.8 7 10.8 7z"
        />
        <path
          fill="#FBBC05"
          d="M5.1 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.2 6.7C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l3.9-3z"
        />
        <path
          fill="#EA4335"
          d="M12 4.7c1.8 0 3 .8 3.7 1.4l2.7-2.7C16.9 1.7 14.7.7 12 .7 7 .7 3.2 4 1.2 7.7l3.9 3c1-3 3.7-6 6.9-6z"
        />
      </svg>
      Continue with Google
    </button>
  );
}
