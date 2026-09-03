"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStoreSettings } from "@/lib/hooks/admin/useStoreSettings";
import { useUpdateStoreSettings } from "@/lib/hooks/admin/useUpdateStoreSettings";
import {
  storeSettingsFormSchema,
  type StoreSettingsFormValues,
} from "@/lib/validation/settings.schema";
import { ApiError } from "@/lib/api/ApiError";

export default function SettingsClient() {
  const { data, isLoading, isError, error, refetch } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();
  const [savedFlash, setSavedFlash] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsFormSchema),
    defaultValues: { freeShippingThreshold: 0, flatShippingFee: 0 },
  });

  useEffect(() => {
    if (data?.settings) {
      reset({
        freeShippingThreshold: data.settings.freeShippingThreshold,
        flatShippingFee: data.settings.flatShippingFee,
      });
    }
  }, [data, reset]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="h-72 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  if (isError || !data) {
    const status = error instanceof ApiError ? error.status : 0;
    const message =
      status === 403
        ? "You don't have permission to view store settings."
        : "Couldn't load store settings.";
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-admin-border bg-admin-card p-6 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <p className="text-sm font-semibold">{message}</p>
        {status !== 403 && (
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const onSubmit = (values: StoreSettingsFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2500);
      },
    });
  };

  const mutationError =
    updateMutation.error instanceof ApiError ? updateMutation.error.message : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">Store Settings</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Storefront-wide policy. Changes take effect immediately for new carts and checkouts.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl space-y-5 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark"
        noValidate
      >
        <div>
          <h2 className="text-sm font-bold">Shipping</h2>
          <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
            Orders at or above the free-delivery threshold ship free; below it, the flat fee is
            added at checkout.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
            Free delivery threshold (₹)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            {...register("freeShippingThreshold")}
            className="w-full max-w-[220px] rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
          />
          {errors.freeShippingThreshold && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.freeShippingThreshold.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
            Flat shipping fee (₹)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            {...register("flatShippingFee")}
            className="w-full max-w-[220px] rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
          />
          {errors.flatShippingFee && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.flatShippingFee.message}
            </p>
          )}
        </div>

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

        <button
          type="submit"
          disabled={updateMutation.isPending || !isDirty}
          className="rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving…" : "Save changes"}
        </button>
      </form>

      {data.settings.updatedAt && (
        <p className="text-xs text-black/40 dark:text-white/40">
          Last updated {new Date(data.settings.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
