"use client";

import Link from "next/link";
import { useSeoPages } from "@/lib/hooks/admin/useSeoContent";
import { segmentFromPageKey } from "@/lib/seo/seoPageRoutes";

const card =
  "rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark";

function Chip({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        on ? "bg-admin-primary/20 text-admin-primary-dark dark:text-admin-primary" : "bg-black/5 text-black/40 dark:bg-white/10 dark:text-white/40"
      }`}
    >
      {children}
    </span>
  );
}

export default function SeoOverviewClient() {
  const { data, isLoading, isError } = useSeoPages();
  const pages = data?.pages ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold">SEO Management</h1>
        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          Page-level SEO, editable HTML content and FAQs. Blank SEO fields keep the page&apos;s built-in defaults.
        </p>
      </div>

      {isError && <p className="text-sm text-red-600 dark:text-red-400">Could not load pages. Please refresh.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className={`${card} h-28 animate-pulse`} />)}
        {pages.map((p) => (
          <Link key={p.pageType} href={`/admin/seo/${segmentFromPageKey(p.pageType)}`} className={`${card} block hover:border-admin-primary-dark`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold">{p.label}</h2>
                <p className="mt-0.5 truncate text-xs text-black/45 dark:text-white/45">{p.path}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip on={p.hasSeo}>SEO</Chip>
              <Chip on={p.hasHtml}>HTML</Chip>
              <Chip on={p.faqEnabled}>{p.faqEnabled ? `FAQ on · ${p.faqCount}` : "FAQ off"}</Chip>
            </div>
          </Link>
        ))}
        <Link href="/admin/seo/product" className={`${card} block hover:border-admin-primary-dark`}>
          <h2 className="font-semibold">Product Details</h2>
          <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">Pick a product to manage its SEO, HTML and FAQs</p>
        </Link>
        <Link href="/admin/seo/category" className={`${card} block hover:border-admin-primary-dark`}>
          <h2 className="font-semibold">Categories</h2>
          <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">Pick a category to manage its SEO, HTML and FAQs</p>
        </Link>
      </div>
    </div>
  );
}
