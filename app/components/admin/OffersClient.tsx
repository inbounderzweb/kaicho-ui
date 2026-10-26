"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOfferFilters } from "@/lib/hooks/admin/useOfferFilters";
import { useOfferList } from "@/lib/hooks/admin/useOffers";
import type { AdminOffer } from "@/lib/api/offer";
import OfferStatusBadge from "./OfferStatusBadge";
import AdminPagination from "./AdminPagination";
import SortableHeader from "./SortableHeader";
import { IconSearch, IconTag } from "../ui/icons";

type SortField = "createdAt" | "endsAt" | "usedCount" | "name";

function fmtDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
}

function ruleLabel(o: AdminOffer) {
  if (o.type === "PERCENTAGE") return `${o.discountPercent ?? 0}% off each unit`;
  if (o.type === "FIXED") return `₹${o.discountAmount ?? 0} off each unit`;
  return `Buy ${o.buyQuantity} Get 1 Free · max ${o.maxFreeUnitsPerOrder} free/order`;
}

function scopeLabel(o: AdminOffer) {
  const parts: string[] = [];
  const plural = (n: number) => `${n} product${n === 1 ? "" : "s"}`;
  if (o.type === "BOGO") {
    // Buy side and free side are different lists — show both.
    if (o.eligibleProductCount) parts.push(`Buy ${plural(o.eligibleProductCount)}`);
    parts.push(o.freeProductCount ? `Free ${plural(o.freeProductCount)}` : "Free: not set");
    return parts.join(" · ");
  }
  if (o.eligibleProductCount) parts.push(plural(o.eligibleProductCount));
  if (o.eligibleCategoryCount) parts.push(`${o.eligibleCategoryCount} categor${o.eligibleCategoryCount === 1 ? "y" : "ies"}`);
  return parts.join(" + ") || "—";
}

function validityLabel(o: AdminOffer) {
  const from = fmtDate(o.startsAt);
  const to = fmtDate(o.endsAt);
  if (from && to) return `${from} – ${to}`;
  if (to) return `Until ${to}`;
  if (from) return `From ${from}`;
  return "No end date";
}

export default function OffersClient() {
  const filters = useOfferFilters();
  const { data, isLoading, isError, refetch, isPlaceholderData } = useOfferList(filters);

  const [searchInput, setSearchInput] = useState(filters.search);
  useEffect(() => {
    const id = setTimeout(() => setSearchInput(filters.search), 0);
    return () => clearTimeout(id);
  }, [filters.search]);
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== filters.search) filters.update({ search: searchInput || undefined });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleSort = (field: SortField) => {
    if (field === filters.sort) {
      filters.update({ sort: field, order: filters.order === "asc" ? "desc" : "asc" }, false);
    } else {
      filters.update({ sort: field, order: "desc" }, false);
    }
  };

  const hasActiveFilters = Boolean(filters.search || filters.status !== "all");
  const clearFilters = () => {
    setSearchInput("");
    filters.update({ search: undefined, status: undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Offers &amp; Promotions</h1>
          <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
            Automatic offers — Buy X Get Y Free, percentage or fixed amount off — applied at cart and checkout.
          </p>
        </div>
        <Link
          href="/admin/offers/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          + Create Offer
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by offer title..."
            className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => filters.update({ status: e.target.value })}
          aria-label="Filter by status"
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="DRAFT">Draft</option>
          <option value="DISABLED">Disabled</option>
          <option value="EXPIRED">Expired</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm font-semibold">Unable to load offers.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-8 text-center">
            <IconTag className="mx-auto h-8 w-8 text-black/20 dark:text-white/20" />
            <p className="mt-3 text-sm font-semibold">No offers found.</p>
            {hasActiveFilters ? (
              <p className="mt-1 text-sm text-black/55 dark:text-white/55">Try changing your search or filters.</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                  Create your first offer — Buy X Get Y Free, a percentage or a fixed amount off — to get started.
                </p>
                <Link
                  href="/admin/offers/new"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-xs font-semibold text-black hover:opacity-90"
                >
                  Create Offer
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
                    <SortableHeader label="Offer" field="name" activeField={filters.sort} activeOrder={filters.order} onSort={handleSort} />
                    <th className="px-5 py-3 font-semibold">Rule</th>
                    <th className="px-5 py-3 font-semibold">Applies to</th>
                    <SortableHeader label="Validity" field="endsAt" activeField={filters.sort} activeOrder={filters.order} onSort={handleSort} />
                    <SortableHeader label="Usage" field="usedCount" activeField={filters.sort} activeOrder={filters.order} onSort={handleSort} />
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {data.items.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3">
                        <Link href={`/admin/offers/${o.id}`} className="font-semibold hover:underline">
                          {o.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-black/70 dark:text-white/70">{ruleLabel(o)}</td>
                      <td className="px-5 py-3 text-black/70 dark:text-white/70">{scopeLabel(o)}</td>
                      <td className="px-5 py-3 text-black/70 dark:text-white/70">{validityLabel(o)}</td>
                      <td className="px-5 py-3 tabular-nums text-black/70 dark:text-white/70">
                        {o.usedCount}
                        {o.usageLimit != null ? ` / ${o.usageLimit}` : ""} used
                      </td>
                      <td className="px-5 py-3">
                        <OfferStatusBadge status={o.effectiveStatus} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/offers/${o.id}`}
                            className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/admin/offers/${o.id}?tab=usage`}
                            className="text-xs font-semibold text-black/55 hover:underline dark:text-white/55"
                          >
                            Usage
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-admin-border sm:hidden dark:divide-admin-border-dark">
              {data.items.map((o) => (
                <div key={o.id} className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/admin/offers/${o.id}`} className="min-w-0 truncate font-semibold hover:underline">
                      {o.name}
                    </Link>
                    <OfferStatusBadge status={o.effectiveStatus} />
                  </div>
                  <p className="text-xs text-black/50 dark:text-white/50">{ruleLabel(o)}</p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    {scopeLabel(o)} · {validityLabel(o)}
                  </p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    {o.usedCount}
                    {o.usageLimit != null ? ` / ${o.usageLimit}` : ""} used
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {data && !isLoading && !isError && (
          <AdminPagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={data.total}
            itemLabel="offers"
            onPageChange={(p) => filters.update({ page: p }, false)}
            onPageSizeChange={(size) => filters.update({ pageSize: size })}
          />
        )}
      </div>
    </div>
  );
}
