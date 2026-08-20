"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import MobileTabBar from "./MobileTabBar";
import WhatsAppButton from "./WhatsAppButton";

/**
 * The customer storefront's chrome (nav header, footer, mobile tab bar,
 * WhatsApp button) — suppressed on /admin/** routes, which render their own
 * shell (AdminShell) instead. {children} (the actual page content) is
 * always rendered by the root layout regardless of this component.
 */
export default function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    // AdminShell (rendered inside {children}) owns its own full-height
    // layout with a sidebar/drawer — no storefront <main> padding or fixed
    // mobile tab bar to clear here.
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileTabBar />
      <WhatsAppButton />
    </>
  );
}
