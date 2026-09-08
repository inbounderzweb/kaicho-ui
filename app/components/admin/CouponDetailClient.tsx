"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCouponDetail,
  useCreateCoupon,
  useUpdateCoupon,
  useSetCouponStatus,
} from "@/lib/hooks/admin/useCoupons";
import { couponFormSchema, type CouponFormValues } from "@/lib/validation/coupon.schema";
import { ApiError } from "@/lib/api/ApiError";
import type { CouponFormPayload } from "@/lib/api/coupon";
import CouponStatusBadge from "./CouponStatusBadge";
import CouponUsageClient from "./CouponUsageClient";
import ConfirmDialog from "./ConfirmDialog";
import { IconChevronLeft } from "../ui/icons";

const FIELD =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";
const LABEL =
  "mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50";
const CARD =
  "space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark";
const ERR = "mt-1 text-xs text-red-600 dark:text-red-400";

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}
function toIsoOrNull(dateInput?: string): string | null {
  return dateInput ? new Date(`${dateInput}T00:00:00`).toISOString() : null;
}

const EMPTY: CouponFormValues = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderValue: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  usageLimitPerUser: "",
  status: "DRAFT",
};

export default function CouponDetailClient({ id }: { id?: string }) {
  const isEdit = Boolean(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "usage" ? "usage" : "details";

  const { data, isLoading, isError, error, refetch } = useCouponDetail(id ?? null);
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon(id ?? "");
  const statusMutation = useSetCouponStatus(id ?? "");

  const [savedFlash, setSavedFlash] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: EMPTY,
  });

  const coupon = data?.coupon;

  useEffect(() => {
    if (!coupon) return;
    reset({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: coupon.discountType === "FREE_DELIVERY" ? "" : String(coupon.discountValue),
      maxDiscountAmount: coupon.maxDiscountAmount != null ? String(coupon.maxDiscountAmount) : "",
      minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : "",
      startsAt: toDateInput(coupon.startsAt),
      expiresAt: toDateInput(coupon.expiresAt),
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
      usageLimitPerUser: coupon.usageLimitPerUser != null ? String(coupon.usageLimitPerUser) : "",
      status: coupon.status === "ARCHIVED" ? "PAUSED" : coupon.status,
    });
  }, [coupon, reset]);

  const discountType = watch("discountType");
  const isArchived = coupon?.status === "ARCHIVED";

  const mutation = isEdit ? updateMutation : createMutation;
  const mutationError = mutation.error instanceof ApiError ? mutation.error.message : null;

  const onSubmit = (values: CouponFormValues) => {
    const parsed = couponFormSchema.parse(values);
    const payload: CouponFormPayload = {
      code: parsed.code,
      name: parsed.name,
      description: parsed.description || undefined,
      discountType: parsed.discountType,
      discountValue: parsed.discountType === "FREE_DELIVERY" ? 0 : parsed.discountValue,
      maxDiscountAmount:
        parsed.discountType === "PERCENTAGE" ? parsed.maxDiscountAmount ?? null : null,
      minOrderValue: parsed.minOrderValue ?? 0,
      startsAt: toIsoOrNull(parsed.startsAt),
      expiresAt: toIsoOrNull(parsed.expiresAt),
      usageLimit: parsed.usageLimit ?? null,
      usageLimitPerUser: parsed.usageLimitPerUser ?? null,
      status: parsed.status,
    };

    if (isEdit) {
      // `status` is managed by the dedicated status control in edit mode.
      const patch: Partial<CouponFormPayload> = { ...payload };
      delete patch.status;
      updateMutation.mutate(patch, {
        onSuccess: () => {
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 2500);
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res) => router.push(`/admin/coupons/${res.coupon.id}`),
      });
    }
  };

  const runStatus = (next: "ACTIVE" | "PAUSED" | "ARCHIVED") => {
    setActionError(null);
    statusMutation.mutate(next, {
      onError: (err) =>
        setActionError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
      onSettled: () => setArchiveOpen(false),
    });
  };

  const nextStatuses = useMemo<("ACTIVE" | "PAUSED" | "ARCHIVED")[]>(() => {
    if (!coupon) return [];
    if (coupon.status === "DRAFT") return ["ACTIVE"];
    if (coupon.status === "ACTIVE") return ["PAUSED"];
    if (coupon.status === "PAUSED") return ["ACTIVE"];
    return [];
  }, [coupon]);

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="h-96 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  if (isEdit && (isError || !data)) {
    const status = error instanceof ApiError ? error.status : 0;
    const message =
      status === 404
        ? "This coupon doesn't exist."
        : status === 403
          ? "You don't have permission to view this coupon."
          : "Couldn't load this coupon.";
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
            href="/admin/coupons"
            className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
          >
            Back to Coupons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/coupons"
          className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Coupons
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">{isEdit ? coupon?.code ?? "Edit" : "New Coupon"}</span>
        {coupon && <CouponStatusBadge status={coupon.effectiveStatus} />}
      </div>

      {isEdit && (
        <div className="flex gap-4 border-b border-admin-border text-sm dark:border-admin-border-dark">
          <Link
            href={`/admin/coupons/${id}`}
            className={`-mb-px border-b-2 px-1 pb-2 font-semibold ${
              tab === "details"
                ? "border-admin-primary-dark text-black dark:border-admin-primary dark:text-white"
                : "border-transparent text-black/50 dark:text-white/50"
            }`}
          >
            Details
          </Link>
          <Link
            href={`/admin/coupons/${id}?tab=usage`}
            className={`-mb-px border-b-2 px-1 pb-2 font-semibold ${
              tab === "usage"
                ? "border-admin-primary-dark text-black dark:border-admin-primary dark:text-white"
                : "border-transparent text-black/50 dark:text-white/50"
            }`}
          >
            Usage{coupon ? ` (${coupon.usedCount})` : ""}
          </Link>
        </div>
      )}

      {isEdit && tab === "usage" && id ? (
        <CouponUsageClient couponId={id} />
      ) : (
        <>
          {/* Status controls (edit only) */}
          {isEdit && coupon && (
            <div className={`${CARD} sm:flex sm:items-center sm:justify-between sm:space-y-0`}>
              <div>
                <p className="text-sm font-semibold">
                  Status: <CouponStatusBadge status={coupon.effectiveStatus} />
                </p>
                {isArchived && (
                  <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                    Archived coupons are read-only. Historical orders keep their discount.
                  </p>
                )}
              </div>
              {!isArchived && (
                <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
                  {nextStatuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => runStatus(s)}
                      className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
                    >
                      {s === "ACTIVE" ? "Activate" : "Pause"}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => setArchiveOpen(true)}
                    className="rounded-full border border-red-500/30 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                  >
                    Archive
                  </button>
                </div>
              )}
            </div>
          )}
          {actionError && (
            <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
              {actionError}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
            <fieldset disabled={isArchived} className="space-y-6 lg:col-span-2">
              {/* Basic */}
              <div className={CARD}>
                <h2 className="text-sm font-bold">Basic information</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Coupon Code *</label>
                    <input {...register("code")} placeholder="KAICHO10" className={`${FIELD} font-mono uppercase`} />
                    {errors.code && <p className={ERR}>{errors.code.message}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Coupon Name *</label>
                    <input {...register("name")} className={FIELD} />
                    {errors.name && <p className={ERR}>{errors.name.message}</p>}
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea {...register("description")} rows={2} className={FIELD} />
                  {errors.description && <p className={ERR}>{errors.description.message}</p>}
                </div>
              </div>

              {/* Discount */}
              <div className={CARD}>
                <h2 className="text-sm font-bold">Discount</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className={LABEL}>Type *</label>
                    <select {...register("discountType")} className={FIELD}>
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed amount</option>
                      <option value="FREE_DELIVERY">Free delivery</option>
                    </select>
                  </div>
                  {discountType !== "FREE_DELIVERY" && (
                    <div>
                      <label className={LABEL}>
                        {discountType === "PERCENTAGE" ? "Percentage (%)" : "Amount (₹)"} *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        {...register("discountValue")}
                        className={FIELD}
                      />
                      {errors.discountValue && <p className={ERR}>{errors.discountValue.message}</p>}
                    </div>
                  )}
                  {discountType === "PERCENTAGE" && (
                    <div>
                      <label className={LABEL}>Maximum discount (₹)</label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        placeholder="No cap"
                        {...register("maxDiscountAmount")}
                        className={FIELD}
                      />
                      {errors.maxDiscountAmount && <p className={ERR}>{errors.maxDiscountAmount.message}</p>}
                    </div>
                  )}
                </div>
                {discountType === "FREE_DELIVERY" && (
                  <p className="text-xs text-black/55 dark:text-white/55">
                    Waives the delivery fee. It is not modelled as a 100% discount.
                  </p>
                )}
              </div>

              {/* Conditions */}
              <div className={CARD}>
                <h2 className="text-sm font-bold">Conditions</h2>
                <div>
                  <label className={LABEL}>Minimum order value (₹)</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="0"
                    {...register("minOrderValue")}
                    className={`${FIELD} sm:max-w-55`}
                  />
                  {errors.minOrderValue && <p className={ERR}>{errors.minOrderValue.message}</p>}
                </div>
              </div>

              {/* Usage */}
              <div className={CARD}>
                <h2 className="text-sm font-bold">Usage limits</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Total usage limit</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      {...register("usageLimit")}
                      className={FIELD}
                    />
                    {errors.usageLimit && <p className={ERR}>{errors.usageLimit.message}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Usage limit per user</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      {...register("usageLimitPerUser")}
                      className={FIELD}
                    />
                    {errors.usageLimitPerUser && <p className={ERR}>{errors.usageLimitPerUser.message}</p>}
                  </div>
                </div>
                {isEdit && coupon && (
                  <p className="text-xs text-black/55 dark:text-white/55">
                    {coupon.usedCount} redemption{coupon.usedCount === 1 ? "" : "s"} so far.
                  </p>
                )}
              </div>

              {/* Validity */}
              <div className={CARD}>
                <h2 className="text-sm font-bold">Validity</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Start date</label>
                    <input type="date" {...register("startsAt")} className={FIELD} />
                  </div>
                  <div>
                    <label className={LABEL}>End date</label>
                    <input type="date" {...register("expiresAt")} className={FIELD} />
                    {errors.expiresAt && <p className={ERR}>{errors.expiresAt.message}</p>}
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Sidebar */}
            <div className="space-y-4">
              {!isEdit && (
                <div className={CARD}>
                  <h2 className="text-sm font-bold">Status</h2>
                  <select {...register("status")} className={FIELD}>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                  </select>
                  <p className="text-xs text-black/55 dark:text-white/55">
                    A coupon must be Active (and within its dates) to be redeemable.
                  </p>
                </div>
              )}

              {mutationError && (
                <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                  {mutationError}
                </p>
              )}
              {savedFlash && (
                <p className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Saved.
                </p>
              )}

              {!isArchived && (
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create Coupon"}
                </button>
              )}

              {/* Activity trail */}
              {isEdit && coupon && coupon.activity.length > 0 && (
                <div className={CARD}>
                  <h2 className="text-sm font-bold">Activity</h2>
                  <ul className="space-y-3">
                    {coupon.activity.map((a) => (
                      <li key={a.id} className="text-xs">
                        <p className="font-semibold text-black/80 dark:text-white/80">
                          {a.action[0] + a.action.slice(1).toLowerCase()}
                          <span className="ml-1 font-normal text-black/45 dark:text-white/45">
                            {new Date(a.at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                            {a.actor ? ` · ${a.actor}` : ""}
                          </span>
                        </p>
                        {a.changes.map((c, i) => (
                          <p key={i} className="text-black/55 dark:text-white/55">
                            {c.field}: {c.from} → {c.to}
                          </p>
                        ))}
                        {a.note && <p className="text-black/55 dark:text-white/55">{a.note}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </form>
        </>
      )}

      <ConfirmDialog
        open={archiveOpen}
        title="Archive this coupon?"
        description="It can no longer be redeemed or edited. Existing orders keep their discount, and the usage history stays intact. This can't be undone."
        confirmLabel="Archive"
        destructive
        isConfirming={statusMutation.isPending}
        onConfirm={() => runStatus("ARCHIVED")}
        onCancel={() => setArchiveOpen(false)}
      />
    </div>
  );
}
