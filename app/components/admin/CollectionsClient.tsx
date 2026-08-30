"use client";

import Link from "next/link";
import { useState } from "react";
import { useCollectionList } from "@/lib/hooks/admin/useCollectionList";
import { useDeleteCollection } from "@/lib/hooks/admin/useDeleteCollection";
import { ApiError } from "@/lib/api/ApiError";
import ConfirmDialog from "./ConfirmDialog";
import StatusBadge from "./StatusBadge";
import { IconPackage } from "../ui/icons";

export default function CollectionsClient() {
  const { data, isLoading, isError, refetch } = useCollectionList();
  const deleteMutation = useDeleteCollection();
  const [deleteTarget, setDeleteTarget] = useState<{ collectionId: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Collections</h1>
          <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
            Curated homepage merchandising groups.
          </p>
        </div>
        <Link
          href="/admin/collections/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          + Add Collection
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm font-semibold">Unable to load collections.</p>
            <button onClick={() => refetch()} className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black">
              Retry
            </button>
          </div>
        ) : data.collections.length === 0 ? (
          <div className="p-8 text-center">
            <IconPackage className="mx-auto h-8 w-8 text-black/20 dark:text-white/20" />
            <p className="mt-3 text-sm font-semibold">No collections found.</p>
            <Link
              href="/admin/collections/new"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-xs font-semibold text-black"
            >
              Create Collection
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Slug</th>
                  <th className="px-5 py-3 font-semibold">Products</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Sort</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                {data.collections.map((c) => (
                  <tr key={c.collectionId}>
                    <td className="px-5 py-3">
                      <Link href={`/admin/collections/${c.collectionId}`} className="font-semibold hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-black/70 dark:text-white/70">{c.slug}</td>
                    <td className="px-5 py-3">{c.productCount}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.isActive ? "Active" : "Inactive"} />
                    </td>
                    <td className="px-5 py-3">{c.sortOrder}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        <Link href={`/admin/collections/${c.collectionId}`} className="text-xs font-semibold text-admin-primary-dark">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ collectionId: c.collectionId, name: c.name })}
                          className="text-xs font-semibold text-red-600"
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
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        description={error ?? "This will remove the collection and its product associations. Products themselves will not be deleted."}
        confirmLabel="Delete Collection"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          setError(null);
          deleteMutation.mutate(deleteTarget.collectionId, {
            onSuccess: () => setDeleteTarget(null),
            onError: (err) => setError(err instanceof ApiError ? err.message : "Something went wrong."),
          });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
