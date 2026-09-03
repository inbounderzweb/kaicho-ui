"use client";

import { useRouter } from "next/navigation";
import {
  IconHeart,
  IconLogout,
  IconMapPin,
  IconMessageCircle,
  IconTruck,
} from "../ui/icons";
import { useLogout } from "@/lib/hooks/useLogout";

export type ProfileSectionId = "orders" | "addresses" | "saved" | "support";

const NAV_ITEMS: { id: ProfileSectionId; label: string; Icon: typeof IconTruck }[] = [
  { id: "orders", label: "My Orders", Icon: IconTruck },
  { id: "addresses", label: "Your Addresses", Icon: IconMapPin },
  // { id: "saved", label: "Saved Items", Icon: IconHeart },
  { id: "support", label: "Customer Support", Icon: IconMessageCircle },
];

export default function ProfileSidebar({
  active,
  onSelect,
}: {
  active: ProfileSectionId;
  onSelect: (section: ProfileSectionId) => void;
}) {
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => router.push("/login"),
    });
  };

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors lg:w-full ${
              isActive
                ? "bg-brand-soft text-brand"
                : "text-ink-muted hover:bg-cream hover:text-ink"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}

      <div className="hidden h-px bg-border lg:my-2 lg:block" />

      <button
        type="button"
        onClick={handleLogout}
        disabled={logout.isPending}
        className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-sale transition-colors hover:bg-sale/10 disabled:opacity-50 lg:w-full"
      >
        <IconLogout className="h-5 w-5" />
        {logout.isPending ? "Logging out…" : "Log out"}
      </button>
      {logout.isError && (
        <p className="px-4 text-xs font-semibold text-sale">
          Couldn&apos;t log out. Please try again.
        </p>
      )}
    </nav>
  );
}
