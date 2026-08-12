import type { Metadata } from "next";
import { Sora, Urbanist } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileTabBar from "./components/MobileTabBar";
import WhatsAppButton from "./components/WhatsAppButton";
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
  metadataBase: new URL("https://kaicho.in"),
  title: {
    default: "Kaicho Foods | Ready-to-Eat Healthy Meals",
    template: "%s | Kaicho Foods",
  },
  description:
    "Diabetic-friendly, gut-healthy, ready-to-eat porridges made with Japanese retort technology. No preservatives, 100% natural, high in fiber & protein. Heat and eat in minutes.",
  keywords: [
    "Kaicho Foods",
    "ready to eat meals",
    "healthy porridge",
    "diabetic friendly food",
    "retort technology",
  ],
  openGraph: {
    title: "Kaicho Foods | Ready-to-Eat Healthy Meals",
    description:
      "Diabetic-friendly, gut-healthy, ready-to-eat porridges made with Japanese retort technology.",
    url: "https://kaicho.in",
    siteName: "Kaicho Foods",
    locale: "en_IN",
    type: "website",
  },
  icons: {
    icon: "/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${urbanist.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-ink">
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <Footer />
        <MobileTabBar />
        <WhatsAppButton />
      </body>
    </html>
  );
}
