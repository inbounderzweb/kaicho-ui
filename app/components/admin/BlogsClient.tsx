"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBlogList, useBlogFilters } from "@/lib/hooks/admin/useBlogQueries";
import { useBulkBlogAction, useDuplicateBlog } from "@/lib/hooks/admin/useBlogMutations";
import { useBlogCategoryOptions } from "@/lib/hooks/admin/useBlogTaxonomy";
import { useAdminUsers } from "@/lib/hooks/admin/useAdminUsers";
import { resolveMediaUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import type { BlogSortOption } from "@/lib/api/blog";
import AdminPagination from "./AdminPagination";
import ConfirmDialog from "./ConfirmDialog";
import { BlogStatusBadge, SeoStatusBadge } from "./BlogStatusBadge";
import { IconSearch } from "../ui/icons";

const control =
  "rounded-xl border border-admin-border bg-admin-card px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-card-dark";

const SORT_OPTIONS: { value: BlogSortOption; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
];

type BulkAction = "publish" | "unpublish" | "archive" | "delete";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogsClient() {
  const router = useRouter();
  const filters = useBlogFilters();
  const { data, isLoading, isError, refetch, isPlaceholderData } = useBlogList(filters);
  const { data: categoryOptions } = useBlogCategoryOptions();
  const { data: adminUsers } = useAdminUsers({ role: "admin", pageSize: 100 });

  const bulkMutation = useBulkBlogAction();
  const duplicateMutation = useDuplicateBlog();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const items = data?.items ?? [];
  const allOnPageSelected = items.length > 0 && items.every((b) => selected.has(b.blogId));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      if (allOnPageSelected) return new Set();
      const next = new Set(prev);
      items.forEach((b) => next.add(b.blogId));
      return next;
    });

  const runBulk = (action: BulkAction) => {
    setRowError(null);
    bulkMutation.mutate(
      { ids: [...selected], action },
      {
        onSuccess: (res) => {
          setSelected(new Set());
          setPendingBulk(null);
          if (res.failed.length) setRowError(`${res.failed.length} post(s) could not be updated.`);
        },
        onError: (err) => {
          setPendingBulk(null);
          setRowError(err instanceof ApiError ? err.message : "Bulk action failed.");
        },
      }
    );
  };

  const runRow = (id: string, action: BulkAction) => {
    setRowError(null);
    bulkMutation.mutate(
      { ids: [id], action },
      { onError: (err) => setRowError(err instanceof ApiError ? err.message : "Action failed.") }
    );
  };

  const needsConfirm = pendingBulk === "archive" || pendingBulk === "delete";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold sm:text-2xl">Blogs</h1>
        <Link
          href="/admin/blogs/new"
          className="rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          Add Blog
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-admin-border bg-admin-card px-3 py-2 dark:border-admin-border-dark dark:bg-admin-card-dark">
          <IconSearch className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" />
          <input
            defaultValue={filters.search}
            onKeyDown={(e) => {
              if (e.key === "Enter") filters.update({ search: (e.target as HTMLInputElement).value });
            }}
            placeholder="Search title, slug, author, category, tag…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => filters.update({ status: e.target.value })}
          className={control}
        >
          <option value="all">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <select
          value={filters.categoryId}
          onChange={(e) => filters.update({ categoryId: e.target.value })}
          className={control}
        >
          <option value="">All categories</option>
          {(categoryOptions ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select value={filters.author} onChange={(e) => filters.update({ author: e.target.value })} className={control}>
          <option value="">All authors</option>
          {(adminUsers?.items ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.phone}
            </option>
          ))}
        </select>

        <select
          value={filters.seoStatus}
          onChange={(e) => filters.update({ seoStatus: e.target.value })}
          className={control}
        >
          <option value="all">Any SEO status</option>
          <option value="good">SEO: Good</option>
          <option value="needs-work">SEO: Needs work</option>
          <option value="poor">SEO: Poor</option>
        </select>

        <select value={filters.sort} onChange={(e) => filters.update({ sort: e.target.value }, false)} className={control}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1 text-xs text-black/55 dark:text-white/55">
          From
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => filters.update({ dateFrom: e.target.value })}
            className={control}
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-black/55 dark:text-white/55">
          To
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => filters.update({ dateTo: e.target.value })}
            className={control}
          />
        </label>
      </div>

      {rowError && (
        <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{rowError}</p>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-admin-border bg-admin-card p-3 text-sm dark:border-admin-border-dark dark:bg-admin-card-dark">
          <span className="font-semibold">{selected.size} selected</span>
          <button type="button" onClick={() => runBulk("publish")} className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold dark:border-admin-border-dark">
            Publish
          </button>
          <button type="button" onClick={() => runBulk("unpublish")} className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold dark:border-admin-border-dark">
            Unpublish
          </button>
          <button type="button" onClick={() => setPendingBulk("archive")} className="rounded-full border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Archive
          </button>
          <button type="button" onClick={() => setPendingBulk("delete")} className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
            Delete
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-black/55 dark:text-white/55">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-black/55 dark:text-white/55">Loading…</div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold">Couldn&apos;t load blogs.</p>
            <button type="button" onClick={() => refetch()} className="mt-2 rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold">No posts match these filters.</p>
            <Link href="/admin/blogs/new" className="mt-2 inline-block text-xs font-semibold text-admin-primary-dark dark:text-admin-primary">
              Write your first post →
            </Link>
          </div>
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} aria-label="Select all" />
                    </th>
                    <th className="px-3 py-3 font-semibold">Post</th>
                    <th className="px-3 py-3 font-semibold">Category</th>
                    <th className="px-3 py-3 font-semibold">Author</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Published</th>
                    <th className="px-3 py-3 font-semibold">Updated</th>
                    <th className="px-3 py-3 font-semibold">SEO</th>
                    <th className="px-3 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {items.map((b) => (
                    <tr key={b.blogId}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(b.blogId)}
                          onChange={() => toggle(b.blogId)}
                          aria-label={`Select ${b.title}`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
                            {b.thumbnailImage && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={resolveMediaUrl(b.thumbnailImage.thumbnailUrl ?? b.thumbnailImage.url)} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <Link href={`/admin/blogs/${b.blogId}`} className="font-semibold hover:underline">
                            {b.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-black/70 dark:text-white/70">{b.category?.name ?? "—"}</td>
                      <td className="px-3 py-3 text-black/70 dark:text-white/70">{b.author?.name ?? "—"}</td>
                      <td className="px-3 py-3">
                        <BlogStatusBadge status={b.status} />
                        {b.status === "SCHEDULED" && b.scheduledFor && (
                          <p className="mt-0.5 text-[11px] text-black/45 dark:text-white/45">{fmtDate(b.scheduledFor)}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-black/55 dark:text-white/55">{fmtDate(b.publishedAt)}</td>
                      <td className="px-3 py-3 text-black/55 dark:text-white/55">{fmtDate(b.updatedAt)}</td>
                      <td className="px-3 py-3">
                        <SeoStatusBadge readiness={b.seoReadiness} score={b.seoScore} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                          <Link href={`/admin/blogs/${b.blogId}`} className="text-admin-primary-dark hover:underline dark:text-admin-primary">
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              duplicateMutation.mutate(b.blogId, {
                                onSuccess: (res) => router.push(`/admin/blogs/${res.blog.blogId}`),
                              })
                            }
                            className="text-black/55 hover:underline dark:text-white/55"
                          >
                            Duplicate
                          </button>
                          {b.status === "PUBLISHED" ? (
                            <button type="button" onClick={() => runRow(b.blogId, "unpublish")} className="text-black/55 hover:underline dark:text-white/55">
                              Unpublish
                            </button>
                          ) : (
                            <button type="button" onClick={() => runRow(b.blogId, "publish")} className="text-black/55 hover:underline dark:text-white/55">
                              Publish
                            </button>
                          )}
                          {b.status !== "ARCHIVED" && (
                            <button type="button" onClick={() => runRow(b.blogId, "archive")} className="text-amber-700 hover:underline dark:text-amber-400">
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

            {/* Mobile cards */}
            <div className="divide-y divide-admin-border lg:hidden dark:divide-admin-border-dark">
              {items.map((b) => (
                <div key={b.blogId} className="flex gap-3 p-4">
                  <input type="checkbox" checked={selected.has(b.blogId)} onChange={() => toggle(b.blogId)} className="mt-1" aria-label={`Select ${b.title}`} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/blogs/${b.blogId}`} className="font-semibold">
                      {b.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <BlogStatusBadge status={b.status} />
                      <SeoStatusBadge readiness={b.seoReadiness} />
                    </div>
                    <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                      {b.category?.name ?? "—"} · {b.author?.name ?? "—"} · updated {fmtDate(b.updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <AdminPagination
              page={filters.page}
              pageSize={filters.pageSize}
              total={data?.total ?? 0}
              itemLabel="posts"
              onPageChange={(p) => filters.update({ page: p }, false)}
              onPageSizeChange={(s) => filters.update({ pageSize: s })}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={needsConfirm}
        title={pendingBulk === "delete" ? "Delete selected posts?" : "Archive selected posts?"}
        description={
          pendingBulk === "delete"
            ? `${selected.size} post(s) will be permanently deleted. This cannot be undone.`
            : `${selected.size} post(s) will be archived (removed from the public blog, kept here).`
        }
        confirmLabel={pendingBulk === "delete" ? "Delete" : "Archive"}
        destructive
        isConfirming={bulkMutation.isPending}
        onConfirm={() => pendingBulk && runBulk(pendingBulk)}
        onCancel={() => setPendingBulk(null)}
      />
    </div>
  );
}
