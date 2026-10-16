"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconHeart,
  IconInstagram,
  IconLinkedin,
  IconLogout,
  IconMapPin,
  IconMessageCircle,
  IconShieldCheck,
  IconTruck,
  IconYoutube,
} from "../ui/icons";
import { useLogout } from "@/lib/hooks/useLogout";
import { useTrackingConsent } from "@/lib/hooks/useTrackingConsent";

export type ProfileSectionId = "orders" | "addresses" | "saved" | "support" | "privacy";

// `mobileLabel` is the short text on the small mobile buttons; lg and up keeps `label`.
const NAV_ITEMS: { id: ProfileSectionId; label: string; mobileLabel: string; Icon: typeof IconTruck }[] = [
  { id: "orders", label: "My Orders", mobileLabel: "My Orders", Icon: IconTruck },
  { id: "addresses", label: "Your Addresses", mobileLabel: "Addresses", Icon: IconMapPin },
  // { id: "saved", label: "Saved Items", mobileLabel: "Saved", Icon: IconHeart },
  { id: "privacy", label: "Privacy", mobileLabel: "Privacy", Icon: IconShieldCheck },
  { id: "support", label: "Customer Support", mobileLabel: "Support", Icon: IconMessageCircle },
];

const BUTTON_BASE =
  "flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors max-lg:[&:last-child:nth-child(odd)]:col-span-2 lg:h-auto lg:w-full lg:justify-start lg:gap-3 lg:rounded-xl lg:border-transparent lg:px-4 lg:py-3 lg:text-sm";

export default function ProfileSidebar({
  active,
  onSelect,
}: {
  active: ProfileSectionId;
  onSelect: (section: ProfileSectionId) => void;
}) {
  const router = useRouter();
  const logout = useLogout();
  // The Privacy tab only exists while the backend has interaction tracking on.
  const { data: consent } = useTrackingConsent();
  const navItems = NAV_ITEMS.filter((item) => item.id !== "privacy" || consent !== undefined);

  const handleLogout = () => {
    // Redirect regardless of the request outcome — useLogout clears the
    // cached session in onSettled either way.
    logout.mutate(undefined, {
      onSettled: () => router.push("/login"),
    });
  };

  return (
    <nav className="flex flex-col gap-2 lg:w-64 lg:shrink-0">
      {/* Mobile: compact two-column grid of small buttons (Flipkart-account
          style) — all sections visible at once, no horizontal scrolling.
          lg and up keeps the original vertical sidebar list. */}
      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-2">
        {navItems.map(({ id, label, mobileLabel, Icon }) => {
          const isActive = active === id;
          const button = (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={isActive ? "page" : undefined}
              className={`${BUTTON_BASE} ${
                isActive
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border bg-white text-ink-muted hover:bg-cream hover:text-ink lg:bg-transparent"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" />
              <span className="whitespace-nowrap">
                <span className="lg:hidden">{mobileLabel}</span>
                <span className="hidden lg:inline">{label}</span>
              </span>
            </button>
          );
          // Mobile order: My Orders, Wishlist, Addresses, Support — Wishlist is
          // its own page, so it's a link that sits right after My Orders.
          return id === "orders"
            ? [
                button,
                <Link
                  key="wishlist"
                  href="/wishlist"
                  className={`${BUTTON_BASE} border-border bg-white text-ink-muted hover:bg-cream hover:text-ink lg:hidden`}
                >
                  <IconHeart className="h-4 w-4 shrink-0" />
                  Wishlist
                </Link>,
              ]
            : button;
        })}
      </div>

      {/* Desktop only: on mobile, Log out lives under the page content
          (ProfileMobileFooter). */}
      <div className="hidden h-px bg-border lg:block" />

      <button
        type="button"
        onClick={handleLogout}
        disabled={logout.isPending}
        className="hidden items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-sale transition-colors hover:bg-sale/10 disabled:opacity-50 lg:flex lg:w-full"
      >
        <IconLogout className="h-5 w-5" />
        {logout.isPending ? "Logging out…" : "Log out"}
      </button>
    </nav>
  );
}

// Mobile only: small Instagram / YouTube links above a compact Log out button,
// placed below the section content (the sidebar's own Log out is desktop-only).
export function ProfileMobileFooter() {
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => router.push("/login"),
    });
  };

  const socials = [
    { label: "Instagram", href: "https://www.instagram.com/kaichofoods/", Icon: IconInstagram },
    { label: "YouTube", href: "https://www.youtube.com/@kaichofoods", Icon: IconYoutube },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/kaicho-foods", Icon: IconLinkedin },
  ];

  return (
    <div className="mt-8 flex flex-col gap-5 border-t border-border pt-6 lg:hidden">
      <div>
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Follow us on</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {socials.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-2 py-3 text-ink-muted transition-colors hover:border-brand hover:text-brand"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold">{label}</span>
            </a>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={logout.isPending}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-sale/30 text-[13px] font-semibold text-sale transition-colors hover:bg-sale/10 disabled:opacity-50"
      >
        <IconLogout className="h-4 w-4" />
        {logout.isPending ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
