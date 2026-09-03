"use client";

import { useState } from "react";
import Link from "next/link";
import AddressesSection from "./AddressesSection";
import CustomerSupportSection from "./CustomerSupportSection";
import OrdersSection from "./OrdersSection";
// import SavedItemsSection from "./SavedItemsSection";
import ProfileSidebar, { type ProfileSectionId } from "./ProfileSidebar";
import { IconChevronRight } from "../ui/icons";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";

const TITLES: Record<ProfileSectionId, string> = {
  orders: "My Orders",
  addresses: "Your Addresses",
  saved: "Saved Items",
  support: "Customer Support",
};

export default function ProfilePageClient() {
  const [section, setSection] = useState<ProfileSectionId>("orders");
  const { user, isAuthorized, authState, refetch } = useRequireAuth();

  if (authState === "error") {
    return (
      <section className="mx-auto flex max-w-[1280px] flex-col items-center justify-center gap-3 px-5 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-ink">Couldn&apos;t load your account.</p>
        <p className="max-w-sm text-sm text-ink-muted">
          This looks like a connection problem, not a sign-out — your session should still
          be fine. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!isAuthorized || !user) {
    return (
      <section className="mx-auto flex max-w-[1280px] items-center justify-center px-5 py-24 sm:px-6 lg:px-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
      </section>
    );
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Kaicho Customer";
  const initials = displayName
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
            {displayName} · {user.countryCode} {user.phone}
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
          {/* {section === "saved" && <SavedItemsSection />} */}
          {section === "support" && <CustomerSupportSection />}
        </div>
      </div>
    </section>
  );
}
