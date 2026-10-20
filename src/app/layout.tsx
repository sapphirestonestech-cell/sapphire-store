import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/components/currency-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SitePattern } from "@/components/shell/site-pattern";
import { TAGLINE } from "@/lib/tagline";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: TAGLINE,
    template: `%s · Sapphire`,
  },
  description: `${TAGLINE} Get affordable yet luxurious rings.`,
};

/**
 * Applies the saved theme before first paint so there is no light/dark flash
 * (DESIGN.md §10). Runs inline, ahead of hydration; the ThemeProvider keeps
 * it in sync afterwards.
 */
const THEME_GUARD = `(function(){try{var t=localStorage.getItem("sapphire_theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_GUARD }} />
      </head>
      <body className="relative flex min-h-full flex-col">
        <ThemeProvider>
          <SitePattern />
          <CurrencyProvider>{children}</CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
