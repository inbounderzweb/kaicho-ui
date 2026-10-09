"use client";

import { useState } from "react";
import { IconShieldCheck } from "../ui/icons";
import {
  useDeleteInteractionData,
  useTrackingConsent,
  useUpdateTrackingConsent,
} from "@/lib/hooks/useTrackingConsent";

export default function PrivacySection() {
  const { data: consent, isLoading, isError } = useTrackingConsent();
  const update = useUpdateTrackingConsent();
  const remove = useDeleteInteractionData();
  const [deleted, setDeleted] = useState<number | null>(null);
  const granted = consent?.granted === true;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
          <IconShieldCheck className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-base font-bold text-ink">Personalised suggestions</h3>
        <p className="mt-1 text-sm text-ink-muted">
          When on, we remember the products and categories you view, what you search for, and what you
          add to your cart or wishlist, to suggest things you may like. This is private to your account,
          is never shown to other customers, and is automatically deleted after 180 days.
        </p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-ink">
            {isLoading ? "Loading…" : granted ? "On" : "Off"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={granted}
            aria-label="Personalised suggestions"
            disabled={isLoading || isError || update.isPending}
            onClick={() => update.mutate(!granted)}
            className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-50 ${granted ? "bg-brand" : "bg-border"}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${granted ? "left-[1.375rem]" : "left-0.5"}`}
            />
          </button>
        </div>
        {isError && <p className="mt-2 text-xs text-sale">Couldn&apos;t load your setting. Try again later.</p>}
        {update.isError && <p className="mt-2 text-xs text-sale">Couldn&apos;t save that. Please try again.</p>}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <h3 className="text-base font-bold text-ink">Delete my browsing history</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Permanently removes everything we&apos;ve recorded about what you viewed and searched. Your
          orders and account are not affected.
        </p>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() => remove.mutate(undefined, { onSuccess: (r) => setDeleted(r.deleted) })}
          className="mt-3 rounded-full border border-sale px-4 py-2 text-sm font-semibold text-sale transition-colors hover:bg-sale/10 disabled:opacity-50"
        >
          {remove.isPending ? "Deleting…" : "Delete history"}
        </button>
        {deleted !== null && (
          <p className="mt-2 text-xs text-ink-muted" role="status">
            Deleted {deleted} {deleted === 1 ? "record" : "records"}.
          </p>
        )}
        {remove.isError && <p className="mt-2 text-xs text-sale">Couldn&apos;t delete. Please try again.</p>}
      </div>
    </div>
  );
}
