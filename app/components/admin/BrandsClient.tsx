"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBrandList } from "@/lib/hooks/admin/useBrandList";
import { useBrandFilters } from "@/lib/hooks/admin/useBrandFilters";
import { useDeleteBrand } from "@/lib/hooks/admin/useDeleteBrand";
import { resolveMediaUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import type { AdminBrand } from "@/lib/api/brand";
import StatusBadge from "./StatusBadge";
import AdminPagination from "./AdminPagination";
import SortableHeader from "./SortableHeader";
import ConfirmDialog from "./ConfirmDialog";
import { IconSearch, IconTag } from "../ui/icons";

type SortField = "createdAt" | "name" | "sortOrder";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BrandsClient() {
  const filters = useBrandFilters();
  const { data, isLoading, isError, refetch, isPlaceholderData } = useBrandList(filters);
  const deleteMutation = useDeleteBrand();

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

  const [deleteTarget, setDeleteTarget] = useState<AdminBrand | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (field === filters.sort) {
      filters.update({ sort: field, order: filters.order === "asc" ? "desc" : "asc" }, false);
    } else {
      filters.update({ sort: field, order: "asc" }, false);
    }
  };

  const hasActiveFilters = Boolean(filters.search || filters.isActive !== "all");
  const clearFilters = () => {
    setSearchInput("");
    filters.update({ search: undefined, isActive: undefined });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteMutation.mutate(deleteTarget.brandId, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setDeleteError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Brands</h1>
          <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">Manage product brands.</p>
        </div>
        <Link
          href="/admin/brands/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          + Add Brand
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search brands..."
            className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
        </div>

        <select
          value={filters.isActive}
          onChange={(e) => filters.update({ isActive: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
            <p className="text-sm font-semibold">Unable to load brands.</p>
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
            <p className="mt-3 text-sm font-semibold">No brands found.</p>
            {hasActiveFilters ? (
              <p className="mt-1 text-sm text-black/55 dark:text-white/55">Try changing your search or filters.</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-black/55 dark:text-white/55">Create your first brand to get started.</p>
                <Link
                  href="/admin/brands/new"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-xs font-semibold text-black hover:opacity-90"
                >
                  Add Brand
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
                    <th className="px-5 py-3 font-semibold">Logo</th>
                    <SortableHeader label="Brand" field="name" activeField={filters.sort} activeOrder={filters.order} onSort={handleSort} />
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <SortableHeader label="Sort Order" field="sortOrder" activeField={filters.sort} activeOrder={filters.order} onSort={handleSort} />
                    <SortableHeader label="Created" field="createdAt" activeField={filters.sort} activeOrder={filters.order} onSort={handleSort} />
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {data.items.map((b) => (
                    <tr key={b.brandId}>
                      <td className="px-5 py-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-admin-surface dark:bg-admin-surface-dark">
                          {b.logo?.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveMediaUrl(b.logo.thumbnailUrl)}
                              alt={b.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/brands/${b.brandId}`} className="font-semibold hover:underline">
                          {b.name}
                        </Link>
                        <p className="text-xs text-black/50 dark:text-white/50">/{b.slug}</p>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={b.isActive ? "Active" : "Inactive"} />
                      </td>
                      <td className="px-5 py-3 tabular-nums text-black/70 dark:text-white/70">{b.sortOrder}</td>
                      <td className="px-5 py-3 text-black/55 dark:text-white/55">{formatDate(b.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/brands/${b.brandId}`}
                            className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(b);
                            }}
                            className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
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

            <div className="divide-y divide-admin-border sm:hidden dark:divide-admin-border-dark">
              {data.items.map((b) => (
                <div key={b.brandId} className="flex gap-3 p-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-admin-surface dark:bg-admin-surface-dark">
                    {b.logo?.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveMediaUrl(b.logo.thumbnailUrl)} alt={b.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/admin/brands/${b.brandId}`} className="font-semibold hover:underline">
                        {b.name}
                      </Link>
                      <StatusBadge status={b.isActive ? "Active" : "Inactive"} />
                    </div>
                    <p className="text-xs text-black/50 dark:text-white/50">/{b.slug}</p>
                    <p className="text-xs text-black/50 dark:text-white/50">
                      Sort {b.sortOrder} · {formatDate(b.createdAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(b);
                      }}
                      className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
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
            itemLabel="brands"
            onPageChange={(p) => filters.update({ page: p }, false)}
            onPageSizeChange={(size) => filters.update({ pageSize: size })}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Brand?"
        description={
          deleteError ?? `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
