"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCategoryDetail } from "@/lib/hooks/admin/useCategoryDetail";
import { useCategoryOptions } from "@/lib/hooks/admin/useCategoryOptions";
import { useCreateCategory } from "@/lib/hooks/admin/useCreateCategory";
import { useUpdateCategory } from "@/lib/hooks/admin/useUpdateCategory";
import { useDeleteCategory } from "@/lib/hooks/admin/useDeleteCategory";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validation/category.schema";
import { ApiError } from "@/lib/api/ApiError";
import type { CategoryOption } from "@/lib/api/category";
import CategoryImagePicker, { type PickedImage } from "./CategoryImagePicker";
import ConfirmDialog from "./ConfirmDialog";
import { IconChevronLeft } from "../ui/icons";

function slugifyClient(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Excludes the category being edited and all of its descendants from the
// parent picker — the backend remains the final authority on circularity,
// this is just a UX pre-filter so the picker doesn't offer obviously-bad
// choices.
function getDescendantIds(options: CategoryOption[], rootId: string): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const o of options) {
    if (o.parentId) childrenByParent.set(o.parentId, [...(childrenByParent.get(o.parentId) ?? []), o.id]);
  }
  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const current = stack.pop()!;
    for (const child of childrenByParent.get(current) ?? []) {
      if (!result.has(child)) {
        result.add(child);
        stack.push(child);
      }
    }
  }
  return result;
}

export default function CategoryDetailClient({ id }: { id?: string }) {
  const isEdit = Boolean(id);
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useCategoryDetail(id ?? null);
  const { data: options } = useCategoryOptions();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(id ?? "");
  const deleteMutation = useDeleteCategory();

  const [image, setImage] = useState<PickedImage | null>(null);
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
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      collectionName: "",
      slug: "",
      description: "",
      parentId: "",
      imageMediaId: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (data?.category) {
      const c = data.category;
      reset({
        name: c.name,
        collectionName: c.collectionName ?? "",
        slug: c.slug,
        description: c.description ?? "",
        parentId: c.parentId ?? "",
        imageMediaId: c.image?.mediaId ?? "",
        isActive: c.isActive,
        sortOrder: c.sortOrder,
      });
      setImage(c.image);
    }
  }, [data, reset]);

  const nameValue = watch("name");
  // Live slug suggestion on create, deferred via setTimeout(…,0) rather than
  // called synchronously in the effect body (same pattern used throughout
  // this admin panel to satisfy react-hooks/set-state-in-effect). Stops
  // suggesting the moment the admin types into the slug field directly.
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
        ? "This category doesn't exist, or isn't reachable from here."
        : status === 403
          ? "You don't have permission to view this category."
          : "Couldn't load this category.";
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
            href="/admin/categories"
            className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
          >
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  const excludedParentIds = isEdit && id ? getDescendantIds(options ?? [], id) : new Set<string>();
  const parentOptions = (options ?? []).filter((o) => o.id !== id && !excludedParentIds.has(o.id));

  const mutation = isEdit ? updateMutation : createMutation;

  const onSubmit = (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
      collectionName: values.collectionName || undefined,
      slug: values.slug || undefined,
      description: values.description || undefined,
      parentId: values.parentId || null,
      imageMediaId: image?.mediaId || null,
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
        onSuccess: (res) => router.push(`/admin/categories/${res.category.categoryId}`),
      });
    }
  };

  const mutationError = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Categories
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">{isEdit ? data?.category.name ?? "Edit" : "New Category"}</span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        noValidate
      >
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
              Collection Name
            </label>
            <input
              {...register("collectionName")}
              placeholder="Shown on homepage"
              className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
            {errors.collectionName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.collectionName.message}</p>
            )}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                Parent Category
              </label>
              <select
                {...register("parentId")}
                className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              >
                <option value="">None (top-level)</option>
                {parentOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                Sort Order
              </label>
              <input
                type="number"
                min={0}
                {...register("sortOrder")}
                className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              />
              {errors.sortOrder && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.sortOrder.message}</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded" />
            Active
          </label>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
            <CategoryImagePicker value={image} onChange={setImage} />
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
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create Category"}
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
                Delete Category
              </button>
            )}
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Category?"
        description={
          deleteError ??
          `Are you sure you want to delete "${data?.category.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          if (!id) return;
          setDeleteError(null);
          deleteMutation.mutate(id, {
            onSuccess: () => router.push("/admin/categories"),
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
