"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInquiryList, useInquiryFilters, useInquiryStats, useInquiryAssignees } from "@/lib/hooks/admin/useInquiries";
import { useDeleteInquiry } from "@/lib/hooks/admin/useInquiryMutations";
import { ApiError } from "@/lib/api/ApiError";
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  type InquiryFormType,
  type InquirySortOption,
} from "@/lib/api/inquiry";
import StatCard from "./StatCard";
import AdminPagination from "./AdminPagination";
import ConfirmDialog from "./ConfirmDialog";
import { InquiryStatusBadge, InquiryFormTypeBadge } from "./InquiryStatusBadge";
import { IconSearch } from "../ui/icons";

const control =
  "rounded-xl border border-admin-border bg-admin-card px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-card-dark";

const SORT_OPTIONS: { value: InquirySortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name A–Z" },
];

const number = new Intl.NumberFormat("en-IN");

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InquiriesClient({ formType }: { formType?: InquiryFormType }) {
  const filters = useInquiryFilters();
  const { data, isLoading, isError, refetch, isPlaceholderData } = useInquiryList({
    ...filters,
    formType: formType ?? filters.formType,
  });
  const { data: stats } = useInquiryStats();
  const { data: assignees } = useInquiryAssignees();
  const deleteMutation = useDeleteInquiry();

  const [pendingDelete, setPendingDelete] = useState<{ id: string; number: string } | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  // A pinned sub-route must not carry a stale ?formType from the All view.
  useEffect(() => {
    if (formType && filters.formType !== "all") filters.update({ formType: undefined }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType, filters.formType]);

  const items = data?.items ?? [];
  const showBulkCols = !formType || formType === "bulk_order";

  const title =
    formType === "bulk_order" ? "Bulk Order Inquiries" : formType === "contact" ? "Contact Inquiries" : "Inquiries";

  const hasActiveFilters =
    filters.search ||
    (!formType && filters.formType !== "all") ||
    filters.status !== "all" ||
    filters.assignedTo ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sort !== "newest";

  const runDelete = () => {
    if (!pendingDelete) return;
    setRowError(null);
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
      onError: (err) => {
        setPendingDelete(null);
        setRowError(err instanceof ApiError ? err.message : "Couldn't delete the inquiry.");
      },
    });
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold sm:text-2xl">{title}</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Inquiries" value={number.format(stats?.total ?? 0)} />
        <StatCard label="New" value={number.format(stats?.byStatus.NEW ?? 0)} />
        <StatCard label="Contacted" value={number.format(stats?.byStatus.CONTACTED ?? 0)} />
        <StatCard label="Quoted" value={number.format(stats?.byStatus.QUOTED ?? 0)} />
        <StatCard label="Converted" value={number.format(stats?.byStatus.CONVERTED ?? 0)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-admin-border bg-admin-card px-3 py-2 dark:border-admin-border-dark dark:bg-admin-card-dark">
          <IconSearch className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" />
          <input
            defaultValue={filters.search}
            onKeyDown={(e) => {
              if (e.key === "Enter") filters.update({ search: (e.target as HTMLInputElement).value });
            }}
            placeholder="Search number, name, email, phone…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {!formType && (
          <select value={filters.formType} onChange={(e) => filters.update({ formType: e.target.value })} className={control}>
            <option value="all">All form types</option>
            <option value="bulk_order">Bulk Order</option>
            <option value="contact">Contact</option>
          </select>
        )}

        <select value={filters.status} onChange={(e) => filters.update({ status: e.target.value })} className={control}>
          <option value="all">All statuses</option>
          {INQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {INQUIRY_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={filters.assignedTo}
          onChange={(e) => filters.update({ assignedTo: e.target.value })}
          className={control}
        >
          <option value="">Any assignee</option>
          <option value="unassigned">Unassigned</option>
          {(assignees ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <select value={filters.sort} onChange={(e) => filters.update({ sort: e.target.value }, false)} className={control}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1 text-xs text-black/55 dark:text-white/55">
          From
          <input type="date" value={filters.dateFrom} onChange={(e) => filters.update({ dateFrom: e.target.value })} className={control} />
        </label>
        <label className="flex items-center gap-1 text-xs text-black/55 dark:text-white/55">
          To
          <input type="date" value={filters.dateTo} onChange={(e) => filters.update({ dateTo: e.target.value })} className={control} />
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => filters.clear()}
            className="rounded-full border border-admin-border px-3 py-2 text-xs font-semibold hover:bg-admin-primary/20 dark:border-admin-border-dark dark:hover:bg-admin-primary/10"
          >
            Clear filters
          </button>
        )}
      </div>

      {rowError && (
        <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{rowError}</p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-black/55 dark:text-white/55">Loading…</div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold">Couldn&apos;t load inquiries.</p>
            <button type="button" onClick={() => refetch()} className="mt-2 rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold">No inquiries found.</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              {hasActiveFilters
                ? "There are no inquiries matching your current filters."
                : "New submissions from the contact and bulk-order forms will appear here."}
            </p>
          </div>
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
                    <th className="px-4 py-3 font-semibold">Inquiry #</th>
                    {!formType && <th className="px-3 py-3 font-semibold">Type</th>}
                    <th className="px-3 py-3 font-semibold">Name</th>
                    <th className="px-3 py-3 font-semibold">Email</th>
                    <th className="px-3 py-3 font-semibold">Phone</th>
                    {showBulkCols && <th className="px-3 py-3 font-semibold">Qty</th>}
                    {showBulkCols && <th className="px-3 py-3 font-semibold">Purpose</th>}
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Assigned</th>
                    <th className="px-3 py-3 font-semibold">Submitted</th>
                    <th className="px-3 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {items.map((inq) => (
                    <tr key={inq.inquiryId}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/inquiries/${inq.inquiryId}`} className="font-mono text-xs font-semibold hover:underline">
                          {inq.inquiryNumber}
                        </Link>
                      </td>
                      {!formType && (
                        <td className="px-3 py-3">
                          <InquiryFormTypeBadge formType={inq.formType} />
                        </td>
                      )}
                      <td className="px-3 py-3 font-medium">{inq.name}</td>
                      <td className="px-3 py-3 text-black/70 dark:text-white/70">{inq.email}</td>
                      <td className="px-3 py-3 text-black/70 dark:text-white/70">{inq.phone ?? "—"}</td>
                      {showBulkCols && (
                        <td className="px-3 py-3 tabular-nums text-black/70 dark:text-white/70">
                          {inq.quantity != null ? number.format(inq.quantity) : "—"}
                        </td>
                      )}
                      {showBulkCols && (
                        <td className="px-3 py-3 text-black/70 dark:text-white/70">
                          <span className="line-clamp-1 max-w-[180px]">{inq.purpose ?? "—"}</span>
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <InquiryStatusBadge status={inq.status} />
                      </td>
                      <td className="px-3 py-3 text-black/70 dark:text-white/70">{inq.assignedTo?.name ?? "—"}</td>
                      <td className="px-3 py-3 text-black/55 dark:text-white/55">{fmtDateTime(inq.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2 text-xs font-semibold">
                          <Link href={`/admin/inquiries/${inq.inquiryId}`} className="text-admin-primary-dark hover:underline dark:text-admin-primary">
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPendingDelete({ id: inq.inquiryId, number: inq.inquiryNumber })}
                            className="text-red-600 hover:underline dark:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-admin-border lg:hidden dark:divide-admin-border-dark">
              {items.map((inq) => (
                <Link key={inq.inquiryId} href={`/admin/inquiries/${inq.inquiryId}`} className="block space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold">{inq.inquiryNumber}</span>
                    <InquiryStatusBadge status={inq.status} />
                  </div>
                  <p className="font-semibold">{inq.name}</p>
                  <p className="text-xs text-black/60 dark:text-white/60">{inq.email}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {!formType && <InquiryFormTypeBadge formType={inq.formType} />}
                    {inq.quantity != null && (
                      <span className="text-xs text-black/55 dark:text-white/55">Qty {number.format(inq.quantity)}</span>
                    )}
                    <span className="text-xs text-black/45 dark:text-white/45">{fmtDateTime(inq.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>

            <AdminPagination
              page={filters.page}
              pageSize={filters.pageSize}
              total={data?.total ?? 0}
              itemLabel="inquiries"
              onPageChange={(p) => filters.update({ page: p }, false)}
              onPageSizeChange={(s) => filters.update({ pageSize: s })}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this inquiry?"
        description={`${pendingDelete?.number ?? ""} and its notes and activity history will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={runDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
