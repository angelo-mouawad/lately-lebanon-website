import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { defaultLocale, dirFor } from "@/i18n/config";
import { getMessages } from "@/i18n";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const t = getMessages();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${t.meta.title}: ${t.meta.tagline}`, template: `%s | ${t.meta.title}` },
  description: t.meta.description,
  applicationName: t.meta.title,
  openGraph: { type: "website", siteName: t.meta.title, locale: "en_LB" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f4efe6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={defaultLocale} dir={dirFor(defaultLocale)} className={`${fraunces.variable} ${geist.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
