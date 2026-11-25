import { defaultLocale, t } from "@keoshaa/i18n";
import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: t(defaultLocale, "app.name"),
  description: t(defaultLocale, "app.tagline"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={defaultLocale}
      className={`${inter.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
