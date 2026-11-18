"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSeoEntities } from "@/lib/hooks/admin/useSeoContent";
import { segmentFromPageKey } from "@/lib/seo/seoPageRoutes";
import type { EntityPageKey } from "@/lib/api/seoContent";
import { IconSearch } from "../../ui/icons";

export default function SeoEntityPicker({ pageType }: { pageType: EntityPageKey }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isError } = useSeoEntities(pageType, search);
  const label = pageType === "PRODUCT" ? "Product" : "Category";
  const items = data?.items ?? [];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/seo" className="text-xs text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white">
          ← SEO Management
        </Link>
        <h1 className="mt-1 font-display text-xl font-bold">{label} SEO</h1>
        <p className="mt-1 text-sm text-black/55 dark:text-white/55">Select a {label.toLowerCase()} to edit.</p>
      </div>

      <div className="relative max-w-md">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Search ${label.toLowerCase()}s…`}
          aria-label={`Search ${label.toLowerCase()}s`}
          className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
        />
      </div>

      {isError && <p className="text-sm text-red-600 dark:text-red-400">Could not load. Please retry.</p>}
      {isLoading && <p className="text-sm text-black/50 dark:text-white/50">Loading…</p>}
      {!isLoading && !isError && items.length === 0 && (
        <p className="text-sm text-black/50 dark:text-white/50">No {label.toLowerCase()}s found.</p>
      )}

      <ul className="divide-y divide-admin-border overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:divide-admin-border-dark dark:border-admin-border-dark dark:bg-admin-card-dark">
        {items.map((it) => (
          <li key={it.id}>
            <Link
              href={`/admin/seo/${segmentFromPageKey(pageType)}/${it.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{it.name}</span>
                <span className="block truncate text-xs text-black/45 dark:text-white/45">/{it.slug}</span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-black/50 dark:text-white/50">
                {it.faqEnabled ? `FAQ on · ${it.faqCount}` : "FAQ off"}
                {it.hasHtml ? " · HTML" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
