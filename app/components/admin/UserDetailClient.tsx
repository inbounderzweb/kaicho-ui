"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminUserDetail } from "@/lib/hooks/admin/useAdminUserDetail";
import { useUpdateAdminUser } from "@/lib/hooks/admin/useUpdateAdminUser";
import { editUserSchema, type EditUserFormValues } from "@/lib/validation/adminUser.schema";
import { ApiError } from "@/lib/api/ApiError";
import StatusBadge from "./StatusBadge";
import ConfirmDialog from "./ConfirmDialog";
import { IconChevronLeft, IconMapPin, IconTruck, IconShieldCheck, IconMessageCircle } from "../ui/icons";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PlaceholderSection({ title, Icon, note }: { title: string; Icon: typeof IconTruck; note: string }) {
  return (
    <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-admin-border py-10 text-center dark:border-admin-border-dark">
        <Icon className="h-6 w-6 text-black/30 dark:text-white/30" />
        <p className="text-sm font-semibold text-black/60 dark:text-white/60">Not available yet</p>
        <p className="max-w-xs text-xs text-black/45 dark:text-white/45">{note}</p>
      </div>
    </div>
  );
}

export default function UserDetailClient({ id }: { id: string }) {
  const { data: user, isLoading, isError, error, refetch } = useAdminUserDetail(id);
  const updateMutation = useUpdateAdminUser(id);
  const [editing, setEditing] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { firstName: "", lastName: "", email: "", role: "user" },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        role: user.role as "user" | "admin",
      });
    }
  }, [user, reset]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="h-48 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
        <div className="h-32 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  if (isError || !user) {
    const status = error instanceof ApiError ? error.status : 0;
    const message =
      status === 404
        ? "This user doesn't exist, or isn't reachable from here."
        : status === 403
          ? "You don't have permission to view this user."
          : "Couldn't load this user.";
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-admin-border bg-admin-card p-6 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <p className="text-sm font-semibold">{message}</p>
        <div className="flex gap-2">
          {status !== 404 && status !== 403 && (
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
            >
              Retry
            </button>
          )}
          <Link
            href="/admin/users"
            className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
  const initials =
    displayName === "—"
      ? "?"
      : displayName
          .split(" ")
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

  const onSubmit = (values: EditUserFormValues) => {
    updateMutation.mutate(values, { onSuccess: () => setEditing(false) });
  };

  const nextActive = user.status !== "Active";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Users
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">{displayName}</span>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-admin-primary text-lg font-bold text-black">
              {initials}
            </div>
            <div>
              <h1 className="font-display text-lg font-bold">{displayName}</h1>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={user.status} />
                <span className="text-xs font-semibold capitalize text-black/55 dark:text-white/55">{user.role}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold hover:bg-admin-primary/20 dark:border-admin-border-dark dark:hover:bg-admin-primary/10"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmStatus(true)}
              className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold hover:bg-admin-primary/20 dark:border-admin-border-dark dark:hover:bg-admin-primary/10"
            >
              {nextActive ? "Activate" : "Deactivate"}
            </button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid grid-cols-1 gap-4 border-t border-admin-border pt-5 dark:border-admin-border-dark sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                First name
              </label>
              <input
                {...register("firstName")}
                className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                Last name
              </label>
              <input
                {...register("lastName")}
                className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                Role
              </label>
              <select
                {...register("role")}
                className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              >
                <option value="user">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {updateMutation.isError && (
              <p className="sm:col-span-2 text-xs font-semibold text-red-600">
                {updateMutation.error instanceof ApiError
                  ? updateMutation.error.message
                  : "Couldn't save changes. Please try again."}
              </p>
            )}

            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-full bg-admin-primary px-5 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  reset();
                }}
                disabled={updateMutation.isPending}
                className="rounded-full border border-admin-border px-5 py-2 text-sm font-semibold disabled:opacity-50 dark:border-admin-border-dark"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-admin-border pt-5 text-sm dark:border-admin-border-dark sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Phone</dt>
              <dd className="mt-0.5 tabular-nums">{user.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Email</dt>
              <dd className="mt-0.5">{user.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Created</dt>
              <dd className="mt-0.5">{formatDateTime(user.joinedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Last login</dt>
              <dd className="mt-0.5">{formatDateTime(user.lastLoginAt)}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Addresses */}
      <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <h2 className="text-sm font-semibold">Addresses</h2>
        {user.addresses.length === 0 ? (
          <p className="mt-3 text-sm text-black/55 dark:text-white/55">No addresses on file.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {user.addresses.map((a, i) => (
              <div
                key={a.id ?? i}
                className="flex items-start gap-3 rounded-xl border border-admin-border p-4 dark:border-admin-border-dark"
              >
                <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-black/40 dark:text-white/40" />
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.label || "Address"}</p>
                    {a.isDefault && (
                      <span className="rounded-full bg-admin-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider dark:bg-admin-primary/20">
                        Default
                      </span>
                    )}
                  </div>
                  {(a.receiverName || a.receiverPhone) && (
                    <p className="mt-0.5 font-semibold text-black/75 dark:text-white/75">
                      {a.receiverName}
                      {a.receiverName && a.receiverPhone ? " · " : ""}
                      {a.receiverPhone}
                    </p>
                  )}
                  <p className="mt-0.5 text-black/65 dark:text-white/65">
                    {[a.houseNo, a.building].filter(Boolean).join(", ") || a.line1}
                    {a.area || a.line2 ? `, ${a.area || a.line2}` : ""}
                    {a.landmark ? `, near ${a.landmark}` : ""}, {a.city}, {a.state} {a.pincode}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-black/40 dark:text-white/40">
          View-only for now — no address management API exists yet.
        </p>
      </div>

      {/* Deferred sections — real placeholders, not omitted, not fabricated */}
      <PlaceholderSection
        title="Orders"
        Icon={IconTruck}
        note="No order-management system exists in the backend yet."
      />
      <PlaceholderSection
        title="Sessions"
        Icon={IconShieldCheck}
        note="Kaicho uses a single-session-per-login model, not per-device tracking — there's nothing to list yet."
      />
      <PlaceholderSection
        title="Activity"
        Icon={IconMessageCircle}
        note="No audit-log system exists in the backend yet."
      />

      <ConfirmDialog
        open={confirmStatus}
        title={nextActive ? "Activate user?" : "Deactivate user?"}
        description={
          nextActive
            ? `${displayName} will regain access to their account.`
            : `${displayName} will no longer be able to access their account. This takes effect immediately.`
        }
        confirmLabel={nextActive ? "Activate" : "Deactivate"}
        destructive={!nextActive}
        isConfirming={updateMutation.isPending}
        onConfirm={() =>
          updateMutation.mutate({ isActive: nextActive }, { onSettled: () => setConfirmStatus(false) })
        }
        onCancel={() => setConfirmStatus(false)}
      />
    </div>
  );
}
