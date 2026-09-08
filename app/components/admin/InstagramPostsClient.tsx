"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInstagramPostFilters } from "@/lib/hooks/admin/useInstagramPostFilters";
import { useInstagramPostList, useDeleteInstagramPost } from "@/lib/hooks/admin/useInstagramPosts";
import { ApiError } from "@/lib/api/ApiError";
import type { InstagramPost } from "@/lib/api/instagramPost";
import StatusBadge from "./StatusBadge";
import AdminPagination from "./AdminPagination";
import ConfirmDialog from "./ConfirmDialog";
import InstagramPreviewModal from "./InstagramPreviewModal";
import { IconSearch, IconInstagram } from "../ui/icons";

const STATUS_LABEL: Record<InstagramPost["status"], string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

// A tiny thumbnail straight from Instagram's own public media endpoint — a
// plain lazy <img>, no API, no scraping, nothing stored. Instagram gates this
// intermittently for logged-out requests, so it falls back to the glyph tile
// and the row (and the full Preview popup) still work. Clicking it opens the
// preview.
function InstagramThumb({
  post,
  onClick,
}: {
  post: Pick<InstagramPost, "shortCode">;
  onClick: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = `https://www.instagram.com/p/${encodeURIComponent(post.shortCode)}/media/?size=t`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Preview ${post.shortCode}`}
      className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-admin-border bg-admin-surface transition-opacity hover:opacity-80 dark:border-admin-border-dark dark:bg-admin-surface-dark"
    >
      {failed ? (
        <IconInstagram className="h-4 w-4 text-black/30 dark:text-white/30" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </button>
  );
}

export default function InstagramPostsClient() {
  const filters = useInstagramPostFilters();
  const { data, isLoading, isError, refetch, isPlaceholderData } = useInstagramPostList(filters);
  const deleteMutation = useDeleteInstagramPost();

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

  const [archiveTarget, setArchiveTarget] = useState<InstagramPost | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<InstagramPost | null>(null);

  const hasActiveFilters = Boolean(filters.search || filters.status !== "all");
  const clearFilters = () => {
    setSearchInput("");
    filters.update({ search: undefined, status: undefined });
  };

  const confirmArchive = () => {
    if (!archiveTarget) return;
    setArchiveError(null);
    deleteMutation.mutate(archiveTarget.id, {
      onSuccess: () => setArchiveTarget(null),
      onError: (err) =>
        setArchiveError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Instagram Posts</h1>
          <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
            Manage Instagram posts that can be displayed on the Kaicho website.
          </p>
        </div>
        <Link
          href="/admin/instagram-posts/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          + Add Instagram Post
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by post code or URL..."
            className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => filters.update({ status: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">Active &amp; inactive</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>

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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm font-semibold">Unable to load Instagram posts.</p>
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
            <IconInstagram className="mx-auto h-8 w-8 text-black/20 dark:text-white/20" />
            <p className="mt-3 text-sm font-semibold">No Instagram posts found.</p>
            {hasActiveFilters ? (
              <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                Try changing your search or filters.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                  Add your first Instagram post to get started.
                </p>
                <Link
                  href="/admin/instagram-posts/new"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-xs font-semibold text-black hover:opacity-90"
                >
                  Add Instagram Post
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {/* Desktop */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
                    <th className="px-5 py-3 font-semibold">Post</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Preview</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {data.items.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/instagram-posts/${p.id}`}
                          className="font-mono font-semibold hover:underline"
                        >
                          {p.shortCode}
                        </Link>
                        <p className="max-w-[320px] truncate text-xs text-black/50 dark:text-white/50">
                          {p.url}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-black/70 dark:text-white/70">
                        {p.postType === "REEL" ? "Reel" : "Post"}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-black/70 dark:text-white/70">
                        {p.displayOrder}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={STATUS_LABEL[p.status]} />
                      </td>
                      <td className="px-5 py-3">
                        <InstagramThumb post={p} onClick={() => setPreviewTarget(p)} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPreviewTarget(p)}
                            className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary"
                          >
                            Preview
                          </button>
                          <Link
                            href={`/admin/instagram-posts/${p.id}`}
                            className="text-xs font-semibold text-black/55 hover:underline dark:text-white/55"
                          >
                            Edit
                          </Link>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-black/55 hover:underline dark:text-white/55"
                          >
                            Open
                          </a>
                          {p.status !== "ARCHIVED" && (
                            <button
                              type="button"
                              onClick={() => {
                                setArchiveError(null);
                                setArchiveTarget(p);
                              }}
                              className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-admin-border sm:hidden dark:divide-admin-border-dark">
              {data.items.map((p) => (
                <div key={p.id} className="flex gap-3 p-4">
                  <InstagramThumb post={p} onClick={() => setPreviewTarget(p)} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/admin/instagram-posts/${p.id}`}
                        className="font-mono font-semibold hover:underline"
                      >
                        {p.shortCode}
                      </Link>
                      <StatusBadge status={STATUS_LABEL[p.status]} />
                    </div>
                    <p className="truncate text-xs text-black/50 dark:text-white/50">{p.url}</p>
                    <p className="text-xs text-black/50 dark:text-white/50">
                      {p.postType === "REEL" ? "Reel" : "Post"} · Order {p.displayOrder}
                    </p>
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewTarget(p)}
                        className="text-xs font-semibold text-admin-primary-dark dark:text-admin-primary"
                      >
                        Preview
                      </button>
                      <Link
                        href={`/admin/instagram-posts/${p.id}`}
                        className="text-xs font-semibold text-black/55 dark:text-white/55"
                      >
                        Edit
                      </Link>
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
            itemLabel="posts"
            onPageChange={(p) => filters.update({ page: p }, false)}
            onPageSizeChange={(size) => filters.update({ pageSize: size })}
          />
        )}
      </div>

      <InstagramPreviewModal
        open={Boolean(previewTarget)}
        post={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive this Instagram post?"
        description={
          archiveError ??
          `"${archiveTarget?.shortCode}" will be hidden from the active list. You can restore it later from the Archived filter.`
        }
        confirmLabel="Archive"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={confirmArchive}
        onCancel={() => {
          setArchiveTarget(null);
          setArchiveError(null);
        }}
      />
    </div>
  );
}
