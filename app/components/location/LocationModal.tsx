"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconMapPin, IconClose, IconSearch, IconChevronRight } from "../ui/icons";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useLocationStore } from "@/lib/store/location.store";
import { useLocation } from "@/lib/location/useLocation";
import { LocationServiceError } from "@/lib/location/errorMessages";
import type { ResolvedLocationDto } from "@/lib/location/types";

const PIN_RE = /^\d{6}$/;

export default function LocationModal() {
  const {
    location,
    label,
    isApproximate,
    permissionState,
    status,
    error,
    selectorOpen,
    detect,
    setManual,
    clear,
    closeSelector,
    search,
    checkServiceability,
  } = useLocation();

  const resolveApproxFromIp = useLocationStore((s) => s.resolveApproxFromIp);

  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<ResolvedLocationDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pinNote, setPinNote] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset transient state each time the sheet opens; lock body scroll + Esc.
  useEffect(() => {
    if (!selectorOpen) return;
    // Deferred so the resets don't run synchronously inside the effect body.
    const reset = setTimeout(() => {
      setQuery("");
      setResults([]);
      setSearchError(null);
      setPinNote(null);
    }, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSelector();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      clearTimeout(reset);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      abortRef.current?.abort();
    };
  }, [selectorOpen, closeSelector]);

  const runSearch = useCallback(
    async (term: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      setSearchError(null);
      setPinNote(null);
      try {
        const isPin = PIN_RE.test(term);
        const [found, serviceability] = await Promise.all([
          search(term, controller.signal),
          isPin
            ? checkServiceability({ pincode: term }).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (controller.signal.aborted) return;
        setResults(found);
        if (isPin) {
          setPinNote(
            serviceability
              ? serviceability.note
              : "Enter a valid 6-digit PIN code, or search by city.",
          );
        }
        if (!isPin && found.length === 0) {
          setSearchError("No matching places. Try a different spelling or a PIN code.");
        }
      } catch (err) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setResults([]);
        setSearchError(
          err instanceof LocationServiceError
            ? err.detail.message
            : "Couldn't search right now. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    },
    [search, checkServiceability],
  );

  useEffect(() => {
    if (!selectorOpen) return;
    const term = debounced;
    const handle = async () => {
      if (term.length < 2 && !PIN_RE.test(term)) {
        setResults([]);
        setSearchError(null);
        setPinNote(null);
        return;
      }
      await runSearch(term);
    };
    void handle();
  }, [debounced, selectorOpen, runSearch]);

  if (!selectorOpen) return null;

  const detecting = status === "detecting";
  const geolocationBlocked =
    permissionState === "denied" || permissionState === "unsupported";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Choose your delivery area">
      <div className="absolute inset-0 bg-ink/50" onClick={closeSelector} />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-2xl outline-none sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[88vh] sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-bold text-ink">Choose your delivery area</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={closeSelector}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-brand-soft hover:text-brand"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {location && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-cream px-3 py-2.5 text-sm">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {label}
                  {isApproximate && <span className="font-normal text-ink-faint"> (approx.)</span>}
                </p>
                {location.address && (
                  <p className="truncate text-xs text-ink-muted">{location.address}</p>
                )}
              </div>
              <button
                type="button"
                onClick={clear}
                className="shrink-0 text-xs font-semibold text-ink-muted hover:text-sale"
              >
                Clear
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => void detect()}
            disabled={detecting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconMapPin className="h-4 w-4" />
            {detecting ? "Detecting…" : "Use my current location"}
          </button>

          {geolocationBlocked && (
            <p className="mt-2 text-xs text-ink-muted">
              Location access is off for this site. You can turn it on in your browser
              settings, or search below.
            </p>
          )}

          {error && !detecting && (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-semibold text-sale">{error.message}</p>
              <button
                type="button"
                onClick={() => void resolveApproxFromIp()}
                className="text-xs font-semibold text-brand hover:text-brand-dark"
              >
                Use my approximate area instead
              </button>
            </div>
          )}

          <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              inputMode="text"
              autoComplete="off"
              aria-label="Search city, area or PIN code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, area or PIN code"
              className="h-11 w-full rounded-full border border-border bg-white pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint hover:text-brand"
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {pinNote && <p className="mt-2 text-xs text-ink-muted">{pinNote}</p>}
          {searchError && <p className="mt-2 text-xs font-semibold text-sale">{searchError}</p>}
          {searching && (
            <p className="mt-3 text-xs text-ink-faint">Searching…</p>
          )}

          {results.length > 0 && (
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {results.map((r, i) => (
                <li key={`${r.displayName}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setManual(r)}
                    className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm transition-colors hover:bg-brand-soft"
                  >
                    <IconMapPin className="h-4 w-4 shrink-0 text-brand" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">
                        {r.city || r.locality || r.displayName}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">{r.displayName}</span>
                    </span>
                    <IconChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 text-[11px] leading-relaxed text-ink-faint">
            Your area helps us show availability and delivery estimates. You&apos;ll still
            confirm your full delivery address at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
