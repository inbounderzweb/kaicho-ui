"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProductDetail } from "@/lib/hooks/admin/useProductDetail";
import { useCreateProduct } from "@/lib/hooks/admin/useCreateProduct";
import { useUpdateProduct } from "@/lib/hooks/admin/useUpdateProduct";
import { useDeleteProduct } from "@/lib/hooks/admin/useDeleteProduct";
import { useCategoryOptions } from "@/lib/hooks/admin/useCategoryOptions";
import { useBrandOptions } from "@/lib/hooks/admin/useBrandOptions";
import { productFormSchema, type ProductFormValues } from "@/lib/validation/product.schema";
import { PRODUCT_STATUSES, type ProductFormInput } from "@/lib/api/product";
import { ApiError } from "@/lib/api/ApiError";
import ProductGalleryPicker, { type PickedGalleryImage } from "./ProductGalleryPicker";
import ConfirmDialog from "./ConfirmDialog";
import { IconChevronLeft, IconClose } from "../ui/icons";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  OUT_OF_STOCK: "Out of Stock",
  ARCHIVED: "Archived",
};

function slugifyClient(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProductDetailClient({ id }: { id?: string }) {
  const isEdit = Boolean(id);
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useProductDetail(id ?? null);
  const { data: categoryOptions } = useCategoryOptions();
  const { data: brandOptions } = useBrandOptions();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(id ?? "");
  const deleteMutation = useDeleteProduct();

  const [images, setImages] = useState<PickedGalleryImage[]>([]);
  const [imagesTouched, setImagesTouched] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
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
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      shortDescription: "",
      description: "",
      categoryId: "",
      brandId: "",
      mrp: 0,
      sellingPrice: 0,
      costPrice: "",
      stockQuantity: 0,
      lowStockThreshold: 10,
      trackInventory: true,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
      status: "DRAFT",
      isFeatured: false,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (data?.product) {
      const p = data.product;
      reset({
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        categoryId: p.categoryId,
        brandId: p.brandId,
        mrp: p.pricing.mrp,
        sellingPrice: p.pricing.sellingPrice,
        costPrice: p.pricing.costPrice ?? "",
        stockQuantity: p.inventory.stockQuantity,
        lowStockThreshold: p.inventory.lowStockThreshold,
        trackInventory: p.inventory.trackInventory,
        seoTitle: p.seo.title,
        seoDescription: p.seo.description,
        seoKeywords: p.seo.keywords,
        canonicalUrl: p.seo.canonicalUrl ?? "",
        ogTitle: p.seo.ogTitle ?? "",
        ogDescription: p.seo.ogDescription ?? "",
        status: p.status,
        isFeatured: p.isFeatured,
        sortOrder: p.sortOrder,
      });
      setImages(p.images.map((img) => ({ mediaId: img.mediaId, url: img.url, thumbnailUrl: img.thumbnailUrl })));
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
        ? "This product doesn't exist, or isn't reachable from here."
        : status === 403
          ? "You don't have permission to view this product."
          : "Couldn't load this product.";
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
            href="/admin/products"
            className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const mutation = isEdit ? updateMutation : createMutation;
  const seoTitle = watch("seoTitle") || "";
  const seoDescription = watch("seoDescription") || "";
  const seoKeywords = watch("seoKeywords") || [];
  const slugValue = watch("slug") || "your-store.com";

  const addKeyword = () => {
    const value = keywordInput.trim().toLowerCase();
    if (!value) return;
    if (!seoKeywords.includes(value) && seoKeywords.length < 20) {
      setValue("seoKeywords", [...seoKeywords, value], { shouldValidate: true });
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    setValue(
      "seoKeywords",
      seoKeywords.filter((k) => k !== kw),
      { shouldValidate: true }
    );
  };

  const onSubmit = (values: ProductFormValues) => {
    setImagesTouched(true);
    if (images.length === 0) return;

    const payload: ProductFormInput = {
      name: values.name,
      slug: values.slug || undefined,
      sku: values.sku,
      shortDescription: values.shortDescription,
      description: values.description,
      categoryId: values.categoryId,
      brandId: values.brandId,
      mediaIds: images.map((img) => img.mediaId),
      pricing: {
        mrp: values.mrp,
        sellingPrice: values.sellingPrice,
        costPrice: values.costPrice === "" || values.costPrice === undefined ? undefined : Number(values.costPrice),
      },
      inventory: {
        stockQuantity: values.stockQuantity,
        lowStockThreshold: values.lowStockThreshold,
        trackInventory: values.trackInventory,
      },
      seo: {
        title: values.seoTitle,
        description: values.seoDescription,
        keywords: values.seoKeywords,
        canonicalUrl: values.canonicalUrl || undefined,
        ogTitle: values.ogTitle || undefined,
        ogDescription: values.ogDescription || undefined,
      },
      status: values.status,
      isFeatured: values.isFeatured,
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
        onSuccess: (res) => router.push(`/admin/products/${res.product.productId}`),
      });
    }
  };

  const mutationError = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Products
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">{isEdit ? data?.product.name ?? "Edit" : "New Product"}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
        <div className="space-y-6 lg:col-span-2">
          {/* Product Information */}
          <section className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
              Product Information
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
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
                  SKU *
                </label>
                <input
                  {...register("sku")}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm font-mono outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
                {errors.sku && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.sku.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Category *
                </label>
                <select
                  {...register("categoryId")}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                >
                  <option value="">Select category…</option>
                  {categoryOptions?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Brand *
                </label>
                <select
                  {...register("brandId")}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                >
                  <option value="">Select brand…</option>
                  {brandOptions?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.brandId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.brandId.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Short Description *
                </label>
                <textarea
                  {...register("shortDescription")}
                  rows={2}
                  maxLength={300}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.shortDescription ? (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.shortDescription.message}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-black/40 dark:text-white/40">
                    {(watch("shortDescription") || "").length}/300
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Description *
                </label>
                <textarea
                  {...register("description")}
                  rows={8}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
                {errors.description && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">Pricing</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  MRP *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("mrp")}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
                {errors.mrp && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.mrp.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Selling Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("sellingPrice")}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
                {errors.sellingPrice && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.sellingPrice.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Cost Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("costPrice")}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
                {errors.costPrice && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.costPrice.message}</p>}
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">Inventory</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min={0}
                  {...register("stockQuantity")}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
                {errors.stockQuantity && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.stockQuantity.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min={0}
                  {...register("lowStockThreshold")}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
                {errors.lowStockThreshold && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lowStockThreshold.message}</p>
                )}
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" {...register("trackInventory")} className="h-4 w-4 rounded" />
                  Track Inventory
                </label>
              </div>
            </div>
          </section>

          {/* SEO */}
          <section className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">SEO</h2>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                SEO Title *
              </label>
              <input
                {...register("seoTitle")}
                maxLength={70}
                className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.seoTitle ? (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.seoTitle.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-black/40 dark:text-white/40">{seoTitle.length}/70</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                SEO Description *
              </label>
              <textarea
                {...register("seoDescription")}
                rows={3}
                maxLength={200}
                className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.seoDescription ? (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.seoDescription.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-black/40 dark:text-white/40">{seoDescription.length}/200</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                Keywords *
              </label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-admin-border bg-admin-surface p-2 dark:border-admin-border-dark dark:bg-admin-surface-dark">
                {seoKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-full bg-admin-primary/30 px-2.5 py-1 text-xs font-semibold dark:bg-admin-primary/20"
                  >
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} aria-label={`Remove ${kw}`}>
                      <IconClose className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                  onBlur={addKeyword}
                  placeholder={seoKeywords.length === 0 ? "Type a keyword and press Enter…" : "Add another…"}
                  className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
                />
              </div>
              {errors.seoKeywords && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.seoKeywords.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Canonical URL
                </label>
                <input
                  {...register("canonicalUrl")}
                  placeholder="https://your-store.com/products/…"
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Open Graph Title
                </label>
                <input
                  {...register("ogTitle")}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Open Graph Description
                </label>
                <textarea
                  {...register("ogDescription")}
                  rows={2}
                  className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-black/50 dark:text-white/50">Search Result Preview</p>
              <div className="rounded-xl border border-admin-border bg-admin-surface p-3 dark:border-admin-border-dark dark:bg-admin-surface-dark">
                <p className="truncate text-[13px] text-black/60 dark:text-white/50">
                  {slugValue.startsWith("http") ? slugValue : `your-store.com › products › ${slugValue}`}
                </p>
                <p className="truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">
                  {seoTitle || "Your SEO title will appear here"}
                </p>
                <p className="line-clamp-2 text-sm text-black/65 dark:text-white/60">
                  {seoDescription || "Your SEO description will appear here, summarizing the product for search results."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Media */}
          <section className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
            <ProductGalleryPicker
              value={images}
              onChange={(next) => {
                setImages(next);
                setImagesTouched(true);
              }}
            />
            {imagesTouched && images.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                At least one product image is required.
              </p>
            )}
          </section>

          {/* Publishing */}
          <section className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
              Publishing
            </h2>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              >
                {PRODUCT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
                Setting Active is only allowed once required fields and a primary image are present.
              </p>
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
              <input type="checkbox" {...register("isFeatured")} className="h-4 w-4 rounded" />
              Featured product
            </label>
          </section>

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
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create Product"}
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
                Delete Product
              </button>
            )}
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Product?"
        description={
          deleteError ??
          `Are you sure you want to delete "${data?.product.name}"? Products with order history are archived instead of permanently removed.`
        }
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          if (!id) return;
          setDeleteError(null);
          deleteMutation.mutate(id, {
            onSuccess: () => router.push("/admin/products"),
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
