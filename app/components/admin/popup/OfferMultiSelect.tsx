"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminOffer } from "@/lib/api/offer";
import { FIELD, HINT, LABEL } from "./fields";

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// One dropdown listing every offer in Offers & Promotions, each with its status
// and end date, with checkboxes so a popup can follow several of them.
export default function OfferMultiSelect({
  offers,
  value,
  onChange,
  loading = false,
}: {
  offers: AdminOffer[];
  value: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const selected = offers.filter((o) => value.includes(o.id));
  // Ids that no longer resolve to a listed offer (deleted, or beyond the list).
  const unknown = value.filter((id) => !offers.some((o) => o.id === id));
  const summary =
    value.length === 0
      ? "Not linked"
      : selected.length === 1 && unknown.length === 0
        ? selected[0].name
        : `${value.length} offers linked`;
  const liveOffers = offers.filter((o) => o.effectiveStatus === "ACTIVE");

  return (
    <div ref={rootRef} className="relative">
      <label className={LABEL} htmlFor="popup-offers">
        Link to offers (Offers &amp; Promotions)
      </label>
      <button
        id="popup-offers"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${FIELD} flex items-center justify-between gap-2 text-left`}
      >
        <span className="min-w-0 truncate">{loading ? "Loading offers…" : summary}</span>
        <span aria-hidden="true" className="shrink-0 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-admin-border bg-admin-card p-2 shadow-xl dark:border-admin-border-dark dark:bg-admin-card-dark">
          <div className="mb-1 flex items-center justify-between gap-2 px-1 text-xs">
            <button type="button" className="font-semibold underline" onClick={() => onChange(liveOffers.map((o) => o.id))} disabled={liveOffers.length === 0}>
              Select all live
            </button>
            <button type="button" className="font-semibold underline" onClick={() => onChange([])} disabled={value.length === 0}>
              Clear
            </button>
          </div>
          <ul role="listbox" aria-multiselectable="true" className="max-h-64 space-y-0.5 overflow-y-auto">
            {offers.length === 0 && <li className="px-2 py-2 text-xs text-black/55 dark:text-white/55">No offers yet. Create one in Offers &amp; Promotions.</li>}
            {offers.map((o) => (
              <li key={o.id} role="option" aria-selected={value.includes(o.id)}>
                <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                  <input type="checkbox" checked={value.includes(o.id)} onChange={() => toggle(o.id)} className="mt-1 h-3.5 w-3.5 shrink-0 accent-admin-primary-dark" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{o.name}</span>
                    <span className="block text-[11px] text-black/55 dark:text-white/55">
                      {o.effectiveStatus.toLowerCase()} · {o.endsAt ? `ends ${dateLabel(o.endsAt)}` : "no end date"}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className={HINT}>
        Optional. The popup shows while <strong>any</strong> linked offer is live and disappears when none is. Its timer counts down to the soonest end among the live ones.
      </p>
      {unknown.length > 0 && <p className={HINT}>{unknown.length} linked offer{unknown.length === 1 ? "" : "s"} not in this list (deleted or not loaded).</p>}
    </div>
  );
}
