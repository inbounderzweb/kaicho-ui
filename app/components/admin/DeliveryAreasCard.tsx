"use client";

import { useMemo, useState } from "react";
import { useUpdateStoreSettings } from "@/lib/hooks/admin/useUpdateStoreSettings";
import { ApiError } from "@/lib/api/ApiError";
import { INDIAN_STATES, type IndianState } from "@/lib/api/indianStates";
import type { StoreSettings } from "@/lib/api/settings";

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

// Admin choice of where the store delivers: all of India, or only the ticked
// states. Saved to the store-settings document; empty selection with the
// restriction on is rejected (here and on the server) so nobody is locked out.
export default function DeliveryAreasCard({ settings }: { settings: StoreSettings }) {
  const savedRestrict = settings.restrictDeliveryToStates === true;
  const savedStates = useMemo(() => settings.serviceableStates ?? [], [settings.serviceableStates]);

  const [restrict, setRestrict] = useState(savedRestrict);
  const [selected, setSelected] = useState<IndianState[]>(savedStates);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState(false);
  const update = useUpdateStoreSettings();

  const dirty = restrict !== savedRestrict || !sameSet(selected, savedStates);
  const needsState = restrict && selected.length === 0;
  const visible = INDIAN_STATES.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()));
  const error = update.error instanceof ApiError ? update.error.message : update.isError ? "Couldn't save delivery areas." : null;

  const toggle = (state: IndianState) =>
    setSelected((cur) => (cur.includes(state) ? cur.filter((s) => s !== state) : [...cur, state]));

  const save = () => {
    if (needsState || update.isPending) return;
    setSaved(false);
    update.mutate(
      { restrictDeliveryToStates: restrict, serviceableStates: restrict ? selected : [] },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      }
    );
  };

  return (
    <section className="max-w-xl space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <div>
        <h2 className="text-sm font-bold">Delivery areas</h2>
        <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
          Choose where you deliver. With a restriction on, only the selected states are served.
        </p>
      </div>

      <div role="radiogroup" aria-label="Delivery coverage" className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" name="coverage" checked={!restrict} onChange={() => setRestrict(false)} className="accent-admin-primary-dark" />
          Deliver across India
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="radio" name="coverage" checked={restrict} onChange={() => setRestrict(true)} className="accent-admin-primary-dark" />
          Only these states
        </label>
      </div>

      {restrict && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search states…"
              aria-label="Search states"
              className="min-w-0 flex-1 rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
            <button
              type="button"
              onClick={() => setSelected((cur) => Array.from(new Set([...cur, ...visible])))}
              className="rounded-full border border-admin-border px-3 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
            >
              Select {query.trim() ? "shown" : "all"}
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-full border border-admin-border px-3 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
            >
              Clear
            </button>
          </div>

          <ul className="grid max-h-72 grid-cols-1 gap-x-4 gap-y-1.5 overflow-y-auto rounded-xl border border-admin-border p-3 sm:grid-cols-2 dark:border-admin-border-dark">
            {visible.map((state) => (
              <li key={state}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(state)}
                    onChange={() => toggle(state)}
                    className="h-3.5 w-3.5 shrink-0 accent-admin-primary-dark"
                  />
                  <span>{state}</span>
                </label>
              </li>
            ))}
            {visible.length === 0 && <li className="text-xs text-black/50 dark:text-white/50">No state matches “{query}”.</li>}
          </ul>

          <p className="text-xs text-black/55 dark:text-white/55">
            {selected.length} of {INDIAN_STATES.length} selected
            {selected.length > 0 && selected.length <= 6 ? `: ${selected.join(", ")}` : ""}
          </p>
          {needsState && <p className="text-xs font-semibold text-red-600 dark:text-red-400">Select at least one state, or choose “Deliver across India”.</p>}
        </div>
      )}

      {error && <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
      {saved && <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Delivery areas saved.</p>}

      <button
        type="button"
        onClick={save}
        disabled={!dirty || needsState || update.isPending}
        className="rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {update.isPending ? "Saving…" : "Save delivery areas"}
      </button>
    </section>
  );
}
