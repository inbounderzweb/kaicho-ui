import type { Metadata, Viewport } from "next";
import { Sora, Urbanist } from "next/font/google";
import Providers from "./providers";
import GoogleTagManager from "./components/analytics/GoogleTagManager";
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
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
      className={`${urbanist.variable} ${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-white text-ink">
        <Providers>
          <GoogleTagManager />
          <JsonLd data={organizationJsonLd()} />
          <JsonLd data={websiteJsonLd()} />
          <StorefrontChrome>{children}</StorefrontChrome>
        </Providers>
      </body>
    </html>
  );
}
