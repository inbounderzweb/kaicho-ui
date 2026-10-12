"use client";

import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useTrackingConsent, useUpdateTrackingConsent } from "@/lib/hooks/useTrackingConsent";

// Asks once, and only logged-in customers who have never answered. Either
// button records an explicit answer, so it never reappears; the choice can
// be changed any time under My Account > Privacy.
export default function TrackingConsentBanner() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const { data: consent } = useTrackingConsent();
  const update = useUpdateTrackingConsent();

  const hidden =
    !user ||
    user.role === "admin" ||
    !consent ||
    consent.updatedAt !== null ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout");
  if (hidden) return null;

  return (
    <div
      role="dialog"
      aria-label="Personalisation preferences"
      className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-lg rounded-2xl border border-border bg-white p-4 shadow-xl lg:bottom-4 lg:left-auto lg:right-4 lg:mx-0"
    >
      <p className="text-sm font-bold text-ink">Make Kaicho work better for you?</p>
      <p className="mt-1 text-xs leading-5 text-ink-muted">
        Let us remember the products you view, search for and add to your cart so we can suggest
        things you may like. It&apos;s private to your account, and you can turn it off or delete it
        any time in My Account &rarr; Privacy.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={update.isPending}
          onClick={() => update.mutate(true)}
          className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          Allow
        </button>
        <button
          type="button"
          disabled={update.isPending}
          onClick={() => update.mutate(false)}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink-muted transition-colors hover:text-ink disabled:opacity-60"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
