"use client";

import { createContext, useContext } from "react";

/**
 * Whether a storefront customer is signed in. The server (storefront layout)
 * resolves this once and provides it, so client components like the wishlist
 * heart can decide whether to mirror a change to the account without wrapping
 * the whole app in a next-auth SessionProvider.
 */
const SignedInContext = createContext(false);

export function SignedInProvider({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <SignedInContext.Provider value={signedIn}>
      {children}
    </SignedInContext.Provider>
  );
}

export function useSignedIn(): boolean {
  return useContext(SignedInContext);
}
