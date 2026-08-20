"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBrandDetail } from "@/lib/hooks/admin/useBrandDetail";
import { useCreateBrand } from "@/lib/hooks/admin/useCreateBrand";
import { useUpdateBrand } from "@/lib/hooks/admin/useUpdateBrand";
import { useDeleteBrand } from "@/lib/hooks/admin/useDeleteBrand";
import { brandFormSchema, type BrandFormValues } from "@/lib/validation/brand.schema";
import { ApiError } from "@/lib/api/ApiError";
import BrandLogoPicker, { type PickedImage } from "./BrandLogoPicker";
import ConfirmDialog from "./ConfirmDialog";
import { IconChevronLeft } from "../ui/icons";

function slugifyClient(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BrandDetailClient({ id }: { id?: string }) {
  const isEdit = Boolean(id);
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useBrandDetail(id ?? null);
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand(id ?? "");
  const deleteMutation = useDeleteBrand();

  const [logo, setLogo] = useState<PickedImage | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: { name: "", slug: "", description: "", logoMediaId: "", isActive: true, sortOrder: 0 },
  });

  useEffect(() => {
    if (data?.brand) {
      const b = data.brand;
      reset({
        name: b.name,
        slug: b.slug,
        description: b.description ?? "",
        logoMediaId: b.logo?.mediaId ?? "",
        isActive: b.isActive,
        sortOrder: b.sortOrder,
      });
      setLogo(b.logo);
    }
  }, [data, reset]);

  const nameValue = watch("name");
  useEffect(() => {
    if (isEdit || slugTouched) return;
    const timeoutId = setTimeout(() => setValue("slug", slugifyClient(nameValue || "")), 0);
    return () => clearTimeout(timeoutId);
  }, [nameValue, isEdit, slugTouched, setValue]);

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
        ? "This brand doesn't exist, or isn't reachable from here."
        : status === 403
          ? "You don't have permission to view this brand."
          : "Couldn't load this brand.";
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
            href="/admin/brands"
            className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
          >
            Back to Brands
          </Link>
        </div>
      </div>
    );
  }

  const mutation = isEdit ? updateMutation : createMutation;

  const onSubmit = (values: BrandFormValues) => {
    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || undefined,
      logoMediaId: logo?.mediaId || null,
      isActive: values.isActive,
      sortOrder: values.sortOrder,
    };

    if (isEdit) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 2500);
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res) => router.push(`/admin/brands/${res.brand.brandId}`),
      });
    }
  };

  const mutationError = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/brands"
          className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Brands
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">{isEdit ? data?.brand.name ?? "Edit" : "New Brand"}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
        <div className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark lg:col-span-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
              Name *
            </label>
            <input
              {...register("name")}
              className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
              Slug
            </label>
            <input
              {...register("slug", { onChange: () => setSlugTouched(true) })}
              placeholder="auto-generated-from-name"
              className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
            {errors.slug && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
              Sort Order
            </label>
            <input
              type="number"
              min={0}
              {...register("sortOrder")}
              className="w-full max-w-[160px] rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
            {errors.sortOrder && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.sortOrder.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded" />
            Active
          </label>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
            <BrandLogoPicker value={logo} onChange={setLogo} />
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

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create Brand"}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
                className="rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400"
              >
                Delete Brand
              </button>
            )}
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Brand?"
        description={
          deleteError ?? `Are you sure you want to delete "${data?.brand.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          if (!id) return;
          setDeleteError(null);
          deleteMutation.mutate(id, {
            onSuccess: () => router.push("/admin/brands"),
            onError: (err) => {
              setDeleteError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
            },
          });
        }}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
