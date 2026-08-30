"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCollectionDetail } from "@/lib/hooks/admin/useCollectionDetail";
import { useCreateCollection } from "@/lib/hooks/admin/useCreateCollection";
import { useUpdateCollection } from "@/lib/hooks/admin/useUpdateCollection";
import { useUpdateCollectionProducts } from "@/lib/hooks/admin/useUpdateCollectionProducts";
import { useDeleteCollection } from "@/lib/hooks/admin/useDeleteCollection";
import { useProductList } from "@/lib/hooks/admin/useProductList";
import { collectionFormSchema, type CollectionFormValues } from "@/lib/validation/collection.schema";
import { ApiError } from "@/lib/api/ApiError";
import ConfirmDialog from "./ConfirmDialog";
import { IconChevronLeft, IconSearch } from "../ui/icons";

type SelectedProduct = { productId: string; name: string; sku: string; price: number };

export default function CollectionDetailClient({ id }: { id?: string }) {
  const isEdit = Boolean(id);
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useCollectionDetail(id ?? null);
  const createMutation = useCreateCollection();
  const updateMutation = useUpdateCollection(id ?? "");
  const updateProductsMutation = useUpdateCollectionProducts(id ?? "");
  const deleteMutation = useDeleteCollection();

  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [search, setSearch] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: productData } = useProductList({ search: search || undefined, pageSize: 8, status: "ACTIVE" });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: { name: "", slug: "", description: "", imageMediaId: "", isActive: true, sortOrder: 0 },
  });

  useEffect(() => {
    if (!data?.collection) return;
    const c = data.collection;
    reset({ name: c.name, slug: c.slug, description: c.description ?? "", imageMediaId: c.image?.mediaId ?? "", isActive: c.isActive, sortOrder: c.sortOrder });
    const id = setTimeout(() => {
      setProducts((c.products ?? []).map((p) => ({ productId: p.productId, name: p.name, sku: p.sku, price: p.pricing.sellingPrice })));
    }, 0);
    return () => clearTimeout(id);
  }, [data, reset]);

  const selectedIds = useMemo(() => new Set(products.map((p) => p.productId)), [products]);

  const onSubmit = (values: CollectionFormValues) => {
    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || undefined,
      imageMediaId: values.imageMediaId || undefined,
      isActive: values.isActive,
      sortOrder: values.sortOrder,
      products: products.map((p, index) => ({ productId: p.productId, sortOrder: index })),
    };
    if (isEdit) {
      updateMutation.mutate(payload, {
        onSuccess: () => updateProductsMutation.mutate(payload.products ?? [], { onSuccess: () => router.push(`/admin/collections/${id}`) }),
      });
    } else {
      createMutation.mutate(payload, { onSuccess: (res) => router.push(`/admin/collections/${res.collection.collectionId}`) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/collections" className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
          <IconChevronLeft className="h-4 w-4" />
          Collections
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">{isEdit ? data?.collection.name ?? "Edit" : "New Collection"}</span>
      </div>

      {isEdit && isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      ) : isEdit && (isError || !data) ? (
        <div className="rounded-2xl border border-admin-border bg-admin-card p-6 dark:border-admin-border-dark dark:bg-admin-card-dark">
          <p className="text-sm font-semibold">{error instanceof ApiError ? error.message : "Couldn't load this collection."}</p>
          <button onClick={() => refetch()} className="mt-3 rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black">Retry</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark lg:col-span-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Name *</label>
              <input {...register("name")} className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark" />
              {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Slug</label>
              <input {...register("slug")} className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Description</label>
              <textarea {...register("description")} rows={4} className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Sort Order</label>
                <input type="number" min={0} {...register("sortOrder", { valueAsNumber: true })} className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark" />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded" />
                Active
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark" />
            </div>
            <div className="max-h-72 space-y-2 overflow-auto">
              {productData?.items.map((p) => (
                <button key={p.productId} type="button" disabled={selectedIds.has(p.productId)} onClick={() => setProducts((prev) => [...prev, { productId: p.productId, name: p.name, sku: p.sku, price: p.pricing.sellingPrice }])} className="w-full rounded-xl border border-admin-border p-3 text-left text-sm disabled:opacity-40 dark:border-admin-border-dark">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-black/55 dark:text-white/55">{p.sku} · Rs. {p.pricing.sellingPrice.toFixed(0)}</div>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {products.map((p, index) => (
                <div key={p.productId} className="flex items-center justify-between rounded-xl border border-admin-border px-3 py-2 text-sm dark:border-admin-border-dark">
                  <span className="truncate">{index + 1}. {p.name}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setProducts((prev) => prev.map((x, i) => i === index - 1 ? p : i === index ? prev[i - 1] : x))} disabled={index === 0} className="text-xs font-semibold disabled:opacity-30">Up</button>
                    <button type="button" onClick={() => setProducts((prev) => prev.filter((x) => x.productId !== p.productId))} className="text-xs font-semibold text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="submit" className="w-full rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black">{isEdit ? "Save changes" : "Create Collection"}</button>
            {isEdit && (
              <button type="button" onClick={() => setDeleteOpen(true)} className="w-full rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-600">Delete Collection</button>
            )}
          </div>
        </form>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete "${data?.collection.name ?? "Collection"}"?`}
        description="This will remove the collection and its product associations. Products themselves will not be deleted."
        confirmLabel="Delete Collection"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          if (!id) return;
          deleteMutation.mutate(id, { onSuccess: () => router.push("/admin/collections") });
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
