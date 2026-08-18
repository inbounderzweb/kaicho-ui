"use client";

import { useState } from "react";
import Link from "next/link";
import AddressesSection from "../components/profile/AddressesSection";
import CustomerSupportSection from "../components/profile/CustomerSupportSection";
import OrdersSection from "../components/profile/OrdersSection";
import SavedItemsSection from "../components/profile/SavedItemsSection";
import ProfileSidebar, { type ProfileSectionId } from "../components/profile/ProfileSidebar";
import { USER } from "../components/profile/profile-data";
import { IconChevronRight } from "../components/ui/icons";

const TITLES: Record<ProfileSectionId, string> = {
  orders: "My Orders",
  addresses: "Your Addresses",
  saved: "Saved Items",
  support: "Customer Support",
};

export default function ProfilePage() {
  const [section, setSection] = useState<ProfileSectionId>("orders");

  const initials = USER.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1.5 text-xs font-medium text-ink-muted sm:text-sm"
      >
        <Link href="/" className="transition-colors hover:text-brand">
          Home
        </Link>
        <IconChevronRight className="h-3.5 w-3.5 text-ink-faint" />
        <span className="font-semibold text-ink">My Account</span>
      </nav>

      {/* Account header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white shadow-lg shadow-brand/20">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
            My Account
          </h1>
          <p className="mt-0.5 truncate text-sm text-ink-muted">
            {USER.name} · {USER.phone}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <ProfileSidebar active={section} onSelect={setSection} />

        <div className="min-w-0 flex-1">
          <h2 className="mb-4 font-display text-lg font-bold text-ink lg:hidden">
            {TITLES[section]}
          </h2>
          {section === "orders" && <OrdersSection />}
          {section === "addresses" && <AddressesSection />}
          {section === "saved" && <SavedItemsSection />}
          {section === "support" && <CustomerSupportSection />}
        </div>
      </div>
    </section>
  );
}
