import type { Metadata } from "next";
import { Sora, Urbanist } from "next/font/google";
import GoogleTagManager from "./components/analytics/GoogleTagManager";
import JsonLd from "./components/seo/JsonLd";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import MobileTabBar from "./components/layout/MobileTabBar";
import WhatsAppButton from "./components/layout/WhatsAppButton";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/seo/urls";
import "./globals.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...buildPageMetadata(),
  keywords: [
    "Kaicho Foods",
    "ready to eat meals",
    "healthy porridge",
    "diabetic friendly food",
    "retort technology",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${urbanist.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-ink">
        <GoogleTagManager />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <Footer />
        <MobileTabBar />
        <WhatsAppButton />
      </body>
    </html>
  );
}
