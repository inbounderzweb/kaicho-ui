"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { blogCategoryFormSchema, type BlogCategoryFormValues } from "@/lib/validation/blogCategory.schema";
import { ApiError } from "@/lib/api/ApiError";
import {
  useBlogCategoryList,
  useBlogCategoryDetail,
  useCreateBlogCategory,
  useUpdateBlogCategory,
  useDeleteBlogCategory,
} from "@/lib/hooks/admin/useBlogTaxonomy";
import BlogImagePicker, { type PickedBlogImage } from "./BlogImagePicker";
import ConfirmDialog from "./ConfirmDialog";
import { IconChevronLeft } from "../ui/icons";

const inputClass =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50";

function slugifyClient(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const EMPTY: BlogCategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  status: "ACTIVE",
};

export default function BlogCategoriesClient({ editId }: { editId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(editId);

  const { data: listData, isLoading } = useBlogCategoryList();
  const { data: detailData } = useBlogCategoryDetail(editId ?? null);
  const createMutation = useCreateBlogCategory();
  const updateMutation = useUpdateBlogCategory(editId ?? "");
  const deleteMutation = useDeleteBlogCategory();

  const [image, setImage] = useState<PickedBlogImage | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [flash, setFlash] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategoryFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    const c = detailData?.category;
    if (!c) return;
    reset({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      metaTitle: c.metaTitle ?? "",
      metaDescription: c.metaDescription ?? "",
      status: c.status,
    });
    setImage(
      c.image ? { mediaId: c.image.mediaId, url: c.image.url, thumbnailUrl: c.image.thumbnailUrl, altText: c.image.altText ?? "" } : null
    );
  }, [detailData, reset]);

  const nameValue = watch("name");
  useEffect(() => {
    if (isEdit || slugTouched) return;
    const t = setTimeout(() => setValue("slug", slugifyClient(nameValue || "")), 0);
    return () => clearTimeout(t);
  }, [nameValue, isEdit, slugTouched, setValue]);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || undefined,
      metaTitle: values.metaTitle || undefined,
      metaDescription: values.metaDescription || undefined,
      status: values.status,
      imageMediaId: image?.mediaId ?? null,
    };
    if (isEdit && editId) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          setFlash(true);
          setTimeout(() => setFlash(false), 2000);
        },
        onError: (err) => setFormError(err instanceof ApiError ? err.message : "Couldn't save."),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res) => router.push(`/admin/blogs/categories/${res.category.categoryId}`),
        onError: (err) => setFormError(err instanceof ApiError ? err.message : "Couldn't create."),
      });
    }
  });

  const mutation = isEdit ? updateMutation : createMutation;
  const categories = listData?.categories ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/blogs" className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
          <IconChevronLeft className="h-4 w-4" />
          Blogs
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">Categories</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-black/55 dark:text-white/55">Loading…</div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-sm text-black/55 dark:text-white/55">No categories yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Slug</th>
                    <th className="px-4 py-3 font-semibold">Posts</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {categories.map((c) => (
                    <tr key={c.categoryId} className={editId === c.categoryId ? "bg-admin-primary/10" : ""}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/blogs/categories/${c.categoryId}`} className="font-semibold hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-black/60 dark:text-white/60">{c.slug}</td>
                      <td className="px-4 py-3 text-black/60 dark:text-white/60">{c.blogCount}</td>
                      <td className="px-4 py-3 text-black/60 dark:text-white/60">{c.status === "ACTIVE" ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
              {isEdit ? "Edit category" : "New category"}
            </h2>
            {isEdit && (
              <Link href="/admin/blogs/categories" className="text-xs font-semibold text-black/55 dark:text-white/55">
                + New
              </Link>
            )}
          </div>

          <div>
            <label className={labelClass}>Name *</label>
            <input {...register("name")} className={inputClass} />
            {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input {...register("slug", { onChange: () => setSlugTouched(true) })} placeholder="auto-from-name" className={inputClass} />
            {errors.slug && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.slug.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea {...register("description")} rows={2} className={inputClass} />
          </div>
          <BlogImagePicker label="Category image" recommended="1200 × 630px" value={image} onChange={setImage} />
          <div>
            <label className={labelClass}>Meta title</label>
            <input {...register("metaTitle")} className={inputClass} />
            {errors.metaTitle && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.metaTitle.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Meta description</label>
            <textarea {...register("metaDescription")} rows={2} className={inputClass} />
            {errors.metaDescription && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.metaDescription.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select {...register("status")} className={inputClass}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {formError && (
            <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{formError}</p>
          )}
          {flash && (
            <p className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Saved.</p>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
            >
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create category"}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400"
              >
                Delete category
              </button>
            )}
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this category?"
        description="Categories used by any post can't be deleted — reassign those posts first."
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          if (!editId) return;
          deleteMutation.mutate(editId, {
            onSuccess: () => router.push("/admin/blogs/categories"),
            onError: (err) => {
              setDeleteOpen(false);
              setFormError(err instanceof ApiError ? err.message : "Couldn't delete.");
            },
          });
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
