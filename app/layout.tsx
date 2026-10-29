import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import Providers from "./providers";
import GoogleTagManager from "./components/analytics/GoogleTagManager";
import PageViewTracker from "./components/analytics/PageViewTracker";
import JsonLd from "./components/seo/JsonLd";
import StorefrontChrome from "./components/layout/StorefrontChrome";
import {
  buildPageMetadata,
  DEFAULT_TITLE,
  SITE_NAME,
  TITLE_TEMPLATE,
} from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/seo/urls";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...buildPageMetadata(),
  // buildPageMetadata() returns a raw (possibly-undefined) `title`, correct
  // for child pages that let this template wrap them — but wrong for the
  // root itself, so it's overridden here with the template/default pair.
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  keywords: [
    "Kaicho Foods",
    "ready to eat meals",
    "nutritious ready-to-eat food",
    "healthy ready-to-eat meals",
    "oats porridge",
    "vegetable oats porridge",
    "diabetic friendly food",
    "retort technology",
    "ready to eat food India",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "food",
  icons: {
    // Google needs a square favicon whose size is a multiple of 48px
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00A861",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Next 16 only forces instant scrolling during route changes (new page →
      // top, back/forward → restored position) when this attribute is present
      // and the page has `scroll-behavior: smooth`. Without it every navigation
      // visibly glides across the whole page instead of landing instantly.
      data-scroll-behavior="smooth"
      className={`${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-white text-ink">
        <Providers>
          <GoogleTagManager />
          <PageViewTracker />
          <JsonLd data={organizationJsonLd()} />
          <JsonLd data={websiteJsonLd()} />
          <StorefrontChrome>{children}</StorefrontChrome>
        </Providers>
      </body>
    </html>
  );
}
