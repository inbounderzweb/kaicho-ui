"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProductList } from "@/lib/hooks/admin/useProductList";
import { useProductFilters } from "@/lib/hooks/admin/useProductFilters";
import { useDeleteProduct } from "@/lib/hooks/admin/useDeleteProduct";
import { useDuplicateProduct } from "@/lib/hooks/admin/useDuplicateProduct";
import { useCategoryOptions } from "@/lib/hooks/admin/useCategoryOptions";
import { useBrandOptions } from "@/lib/hooks/admin/useBrandOptions";
import { resolveMediaUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import { PRODUCT_STATUSES, type AdminProductListItem } from "@/lib/api/product";
import StatusBadge from "./StatusBadge";
import AdminPagination from "./AdminPagination";
import SortableHeader from "./SortableHeader";
import ConfirmDialog from "./ConfirmDialog";
import { IconSearch, IconPackage, IconStar } from "../ui/icons";

type SortField = "name" | "price" | "stock" | "sortOrder" | "createdAt";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  OUT_OF_STOCK: "Out of stock",
  ARCHIVED: "Archived",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProductsClient() {
  const router = useRouter();
  const filters = useProductFilters();
  const { data: categoryOptions } = useCategoryOptions();
  const { data: brandOptions } = useBrandOptions();

  const { data, isLoading, isError, refetch, isPlaceholderData } = useProductList({
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
    brandId: filters.brandId || undefined,
    status: filters.status,
    isFeatured: filters.isFeatured,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    inStock: filters.inStock,
    sort: filters.sort,
    order: filters.order,
  });

  const deleteMutation = useDeleteProduct();
  const duplicateMutation = useDuplicateProduct();

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

  const [deleteTarget, setDeleteTarget] = useState<AdminProductListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (field === filters.sort) {
      filters.update({ sort: field, order: filters.order === "asc" ? "desc" : "asc" }, false);
    } else {
      filters.update({ sort: field, order: "asc" }, false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.categoryId ||
      filters.brandId ||
      filters.status !== "all" ||
      filters.isFeatured !== "all" ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.inStock !== "all"
  );

  const clearFilters = () => {
    setSearchInput("");
    filters.update({
      search: undefined,
      categoryId: undefined,
      brandId: undefined,
      status: undefined,
      isFeatured: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteMutation.mutate(deleteTarget.productId, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setDeleteError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      },
    });
  };

  const handleDuplicate = (product: AdminProductListItem) => {
    setDuplicateError(null);
    setDuplicatingId(product.productId);
    duplicateMutation.mutate(product.productId, {
      onSuccess: (res) => {
        setDuplicatingId(null);
        router.push(`/admin/products/${res.product.productId}`);
      },
      onError: (err) => {
        setDuplicatingId(null);
        setDuplicateError(err instanceof ApiError ? err.message : "Couldn't duplicate this product. Please try again.");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Products</h1>
          <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">Manage your product catalog.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          + Add Product
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, SKU, slug..."
            className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
        </div>

        <select
          value={filters.categoryId}
          onChange={(e) => filters.update({ categoryId: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="">All categories</option>
          {categoryOptions?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filters.brandId}
          onChange={(e) => filters.update({ brandId: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="">All brands</option>
          {brandOptions?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => filters.update({ status: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">All statuses</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={filters.inStock}
          onChange={(e) => filters.update({ inStock: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">All stock</option>
          <option value="inStock">In stock</option>
          <option value="outOfStock">Out of stock</option>
        </select>

        <select
          value={filters.isFeatured}
          onChange={(e) => filters.update({ isFeatured: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">Featured &amp; standard</option>
          <option value="true">Featured only</option>
          <option value="false">Standard only</option>
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={filters.minPrice}
            onChange={(e) => filters.update({ minPrice: e.target.value || undefined })}
            placeholder="Min ₹"
            className="w-24 rounded-xl border border-admin-border bg-admin-surface px-2.5 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
          <span className="text-black/40 dark:text-white/40">–</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={filters.maxPrice}
            onChange={(e) => filters.update({ maxPrice: e.target.value || undefined })}
            placeholder="Max ₹"
            className="w-24 rounded-xl border border-admin-border bg-admin-surface px-2.5 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
        </div>

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

      {duplicateError && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {duplicateError}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm font-semibold">Couldn&apos;t load products.</p>
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
            <IconPackage className="mx-auto h-8 w-8 text-black/20 dark:text-white/20" />
            <p className="mt-3 text-sm font-semibold">No products found.</p>
            {hasActiveFilters ? (
              <p className="mt-1 text-sm text-black/55 dark:text-white/55">Try changing your search or filters.</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-black/55 dark:text-white/55">Create your first product to get started.</p>
                <Link
                  href="/admin/products/new"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-xs font-semibold text-black hover:opacity-90"
                >
                  Add Product
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
                    <th className="px-5 py-3 font-semibold">Image</th>
                    <SortableHeader label="Product" field="name" activeField={filters.sort} activeOrder={filters.order} onSort={handleSort} />
                    <th className="px-5 py-3 font-semibold">SKU</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Brand</th>
                    <SortableHeader label="Price" field="price" activeField={filters.sort} activeOrder={filters.order} onSort={handleSort} />
                    <SortableHeader label="Stock" field="stock" activeField={filters.sort} activeOrder={filters.order} onSort={handleSort} />
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Featured</th>
                    <th className="px-5 py-3 font-semibold">Updated</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {data.items.map((p) => (
                    <tr key={p.productId}>
                      <td className="px-5 py-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-admin-surface dark:bg-admin-surface-dark">
                          {p.image?.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveMediaUrl(p.image.thumbnailUrl)}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/products/${p.productId}`} className="font-semibold hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-xs text-black/50 dark:text-white/50">/{p.slug}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-black/70 dark:text-white/70">{p.sku}</td>
                      <td className="px-5 py-3 text-black/70 dark:text-white/70">{p.category.name ?? "—"}</td>
                      <td className="px-5 py-3 text-black/70 dark:text-white/70">{p.brand.name ?? "—"}</td>
                      <td className="px-5 py-3 tabular-nums">
                        <span className="font-semibold">{currency.format(p.pricing.sellingPrice)}</span>
                        {p.pricing.discount > 0 && (
                          <span className="ml-1.5 text-xs text-black/40 line-through dark:text-white/40">
                            {currency.format(p.pricing.mrp)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        <span className="text-black/70 dark:text-white/70">{p.inventory.stockQuantity}</span>
                        {p.inventory.trackInventory &&
                          p.inventory.stockQuantity > 0 &&
                          p.inventory.stockQuantity <= p.inventory.lowStockThreshold && (
                            <span className="ml-1.5 inline-block">
                              <StatusBadge status="Low stock" />
                            </span>
                          )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={STATUS_LABELS[p.status] ?? p.status} />
                      </td>
                      <td className="px-5 py-3">
                        {p.isFeatured && <IconStar className="h-4 w-4 text-amber-500" aria-label="Featured" />}
                      </td>
                      <td className="px-5 py-3 text-black/55 dark:text-white/55">{formatDate(p.updatedAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/products/${p.productId}`}
                            className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p)}
                            disabled={duplicatingId === p.productId}
                            className="text-xs font-semibold text-black/60 hover:underline disabled:opacity-50 dark:text-white/60"
                          >
                            {duplicatingId === p.productId ? "Duplicating…" : "Duplicate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(p);
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
              {data.items.map((p) => (
                <div key={p.productId} className="flex gap-3 p-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-admin-surface dark:bg-admin-surface-dark">
                    {p.image?.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveMediaUrl(p.image.thumbnailUrl)} alt={p.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/admin/products/${p.productId}`} className="font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <StatusBadge status={STATUS_LABELS[p.status] ?? p.status} />
                    </div>
                    <p className="text-xs text-black/50 dark:text-white/50">
                      {p.sku} · {p.category.name ?? "—"} · {p.brand.name ?? "—"}
                    </p>
                    <p className="text-xs tabular-nums text-black/60 dark:text-white/60">
                      {currency.format(p.pricing.sellingPrice)}
                      {p.pricing.discount > 0 && (
                        <span className="ml-1 line-through opacity-60">{currency.format(p.pricing.mrp)}</span>
                      )}
                      {" · "}
                      {p.inventory.stockQuantity} in stock
                      {p.isFeatured && " · Featured"}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <Link
                        href={`/admin/products/${p.productId}`}
                        className="text-xs font-semibold text-admin-primary-dark dark:text-admin-primary"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(p)}
                        disabled={duplicatingId === p.productId}
                        className="text-xs font-semibold text-black/60 disabled:opacity-50 dark:text-white/60"
                      >
                        {duplicatingId === p.productId ? "Duplicating…" : "Duplicate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(p);
                        }}
                        className="text-xs font-semibold text-red-600 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
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
            itemLabel="products"
            onPageChange={(p) => filters.update({ page: p }, false)}
            onPageSizeChange={(size) => filters.update({ pageSize: size })}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product?"
        description={
          deleteError ??
          `Are you sure you want to delete "${deleteTarget?.name}"? Products with order history are archived instead of permanently removed.`
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
