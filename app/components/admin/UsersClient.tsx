"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminUsers } from "@/lib/hooks/admin/useAdminUsers";
import { useAdminUserStats } from "@/lib/hooks/admin/useAdminUserStats";
import { useUsersFilters } from "@/lib/hooks/admin/useUsersFilters";
import { useSetAdminUserStatus } from "@/lib/hooks/admin/useSetAdminUserStatus";
import type { AdminUser, SortOrder, UsersSortField } from "@/lib/api/admin";
import StatCard from "./StatCard";
import StatusBadge from "./StatusBadge";
import AdminPagination from "./AdminPagination";
import SortableHeader from "./SortableHeader";
import ConfirmDialog from "./ConfirmDialog";
import { IconSearch } from "../ui/icons";

const DATE_PRESETS = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom range" },
];

// Sensible default direction the first time a column is sorted — most
// recent first for dates, alphabetical for text.
const DEFAULT_ORDER: Record<UsersSortField, SortOrder> = {
  createdAt: "desc",
  lastLoginAt: "desc",
  phone: "asc",
  role: "asc",
};

function presetToRange(preset: string): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  if (preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { dateFrom: start.toISOString() };
  }
  if (preset === "7d") return { dateFrom: new Date(now.getTime() - 7 * 86_400_000).toISOString() };
  if (preset === "30d") return { dateFrom: new Date(now.getTime() - 30 * 86_400_000).toISOString() };
  if (preset === "month") return { dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
  return {};
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function UsersClient() {
  const filters = useUsersFilters();
  const { data: stats } = useAdminUserStats();
  const { data, isLoading, isError, refetch, isPlaceholderData } = useAdminUsers(filters);
  const statusMutation = useSetAdminUserStatus();

  // Local input state so typing feels instant; the URL/query only updates
  // after a short debounce, so search never fires a request per keystroke.
  const [searchInput, setSearchInput] = useState(filters.search);
  // Deferred via setTimeout(…, 0) rather than a direct call in the effect
  // body: keeps this in sync with external changes (browser back/forward,
  // "Clear Filters") without tripping react-hooks' set-state-in-effect rule.
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

  const [datePreset, setDatePreset] = useState<string>(filters.dateFrom || filters.dateTo ? "custom" : "");
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string; nextActive: boolean } | null>(null);

  const handleSort = (field: UsersSortField) => {
    if (field === filters.sortBy) {
      filters.update({ sortBy: field, sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" }, false);
    } else {
      filters.update({ sortBy: field, sortOrder: DEFAULT_ORDER[field] }, false);
    }
  };

  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    const range = presetToRange(preset);
    filters.update({ dateFrom: range.dateFrom, dateTo: range.dateTo });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status !== "all" || filters.role !== "all" || filters.dateFrom || filters.dateTo
  );

  const clearFilters = () => {
    setSearchInput("");
    setDatePreset("");
    filters.update({ search: undefined, status: undefined, role: undefined, dateFrom: undefined, dateTo: undefined });
  };

  const requestStatusChange = (user: AdminUser) => {
    setConfirmTarget({ id: user.id, name: user.name, nextActive: user.status !== "Active" });
  };

  const confirmStatusChange = () => {
    if (!confirmTarget) return;
    statusMutation.mutate(
      { id: confirmTarget.id, isActive: confirmTarget.nextActive },
      { onSettled: () => setConfirmTarget(null) }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Users</h1>
        <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
          Manage customers, admins, and user accounts. Your own account is excluded from this list.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats ? stats.totalUsers.toLocaleString("en-IN") : "—"} />
        <StatCard label="Active Users" value={stats ? stats.activeUsers.toLocaleString("en-IN") : "—"} />
        <StatCard label="Inactive Users" value={stats ? stats.inactiveUsers.toLocaleString("en-IN") : "—"} />
        <StatCard label="New (30 days)" value={stats ? stats.newUsersLast30Days.toLocaleString("en-IN") : "—"} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => filters.update({ status: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={filters.role}
          onChange={(e) => filters.update({ role: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">All roles</option>
          <option value="user">Customer</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={datePreset}
          onChange={(e) => handleDatePreset(e.target.value)}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {datePreset === "custom" && (
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={filters.dateFrom?.slice(0, 10) ?? ""}
              onChange={(e) =>
                filters.update({ dateFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className="rounded-xl border border-admin-border bg-admin-surface px-2 py-2 dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
            <span className="text-black/40 dark:text-white/40">to</span>
            <input
              type="date"
              value={filters.dateTo?.slice(0, 10) ?? ""}
              onChange={(e) =>
                filters.update({ dateTo: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className="rounded-xl border border-admin-border bg-admin-surface px-2 py-2 dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
          </div>
        )}

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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm font-semibold">Couldn&apos;t load users.</p>
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
            <p className="text-sm font-semibold">No users found</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {/* Table on sm+ */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
                    <th className="px-5 py-3 font-semibold">User</th>
                    <SortableHeader label="Phone" field="phone" activeField={filters.sortBy} activeOrder={filters.sortOrder} onSort={handleSort} />
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <SortableHeader label="Role" field="role" activeField={filters.sortBy} activeOrder={filters.sortOrder} onSort={handleSort} />
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <SortableHeader label="Joined" field="createdAt" activeField={filters.sortBy} activeOrder={filters.sortOrder} onSort={handleSort} />
                    <SortableHeader label="Last Login" field="lastLoginAt" activeField={filters.sortBy} activeOrder={filters.sortOrder} onSort={handleSort} />
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {data.items.map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-3">
                        <Link href={`/admin/users/${u.id}`} className="font-semibold hover:underline">
                          {u.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-black/70 dark:text-white/70">{u.phone || "—"}</td>
                      <td className="px-5 py-3 text-black/70 dark:text-white/70">{u.email ?? "—"}</td>
                      <td className="px-5 py-3 capitalize text-black/70 dark:text-white/70">{u.role}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-5 py-3 text-black/55 dark:text-white/55">{formatDate(u.joinedAt)}</td>
                      <td className="px-5 py-3 text-black/55 dark:text-white/55">{formatDate(u.lastLoginAt)}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => requestStatusChange(u)}
                          className="rounded-full border border-admin-border px-2.5 py-1 text-xs font-semibold hover:bg-admin-primary/20 dark:border-admin-border-dark dark:hover:bg-admin-primary/10"
                        >
                          {u.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stacked cards below sm */}
            <div className="divide-y divide-admin-border sm:hidden dark:divide-admin-border-dark">
              {data.items.map((u) => (
                <div key={u.id} className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/admin/users/${u.id}`} className="font-semibold hover:underline">
                      {u.name}
                    </Link>
                    <StatusBadge status={u.status} />
                  </div>
                  <p className="text-xs tabular-nums text-black/60 dark:text-white/60">{u.phone || "—"}</p>
                  {u.email && <p className="text-xs text-black/60 dark:text-white/60">{u.email}</p>}
                  <p className="text-xs capitalize text-black/60 dark:text-white/60">{u.role}</p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Joined {formatDate(u.joinedAt)} · Last login {formatDate(u.lastLoginAt)}
                  </p>
                  <button
                    type="button"
                    onClick={() => requestStatusChange(u)}
                    className="mt-1 rounded-full border border-admin-border px-2.5 py-1 text-xs font-semibold dark:border-admin-border-dark"
                  >
                    {u.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
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
            itemLabel="users"
            onPageChange={(p) => filters.update({ page: p }, false)}
            onPageSizeChange={(size) => filters.update({ pageSize: size })}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.nextActive ? "Activate user?" : "Deactivate user?"}
        description={
          confirmTarget?.nextActive
            ? `${confirmTarget?.name} will regain access to their account.`
            : `${confirmTarget?.name} will no longer be able to access their account. This takes effect immediately.`
        }
        confirmLabel={confirmTarget?.nextActive ? "Activate" : "Deactivate"}
        destructive={!confirmTarget?.nextActive}
        isConfirming={statusMutation.isPending}
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
