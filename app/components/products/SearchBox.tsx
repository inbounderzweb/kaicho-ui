"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { IconSearch, IconClose } from "../ui/icons";

// Debounced (300ms) so filter/URL updates and the resulting query-key
// change (and network request) don't fire on every keystroke. Local state
// updates immediately for a responsive-feeling input; only the debounced
// value is pushed up to the caller (useCatalogFilters' `update`).
export default function SearchBox({
  value,
  onChange,
  placeholder = "Search products...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  // Tracks the last `value` prop we've synced from, so an external change
  // (e.g. a "clear filters" action) can be adopted during render — the
  // React-docs-recommended "adjusting state when a prop changes" pattern —
  // instead of a useEffect that calls setState synchronously in its body
  // (flagged by react-hooks/set-state-in-effect: it causes an extra
  // cascading render). This still doesn't fight the user's own typing,
  // since `local` only gets overwritten when `value` itself changes.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setLocal(value);
  }

  const debounced = useDebouncedValue(local, 300);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="relative">
      <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        role="searchbox"
        aria-label="Search products"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-border bg-white pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
      />
      {local && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setLocal("")}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint hover:text-brand"
        >
          <IconClose className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
