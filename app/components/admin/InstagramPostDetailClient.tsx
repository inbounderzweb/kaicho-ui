"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInstagramPostDetail,
  useCreateInstagramPost,
  useUpdateInstagramPost,
  useSetInstagramPostStatus,
  useDeleteInstagramPost,
} from "@/lib/hooks/admin/useInstagramPosts";
import {
  instagramPostFormSchema,
  type InstagramPostFormValues,
} from "@/lib/validation/instagramPost.schema";
import { parseInstagramUrl } from "@/lib/utils/instagramUrl";
import { ApiError } from "@/lib/api/ApiError";
import ConfirmDialog from "./ConfirmDialog";
import StatusBadge from "./StatusBadge";
import InstagramEmbed from "./InstagramEmbed";
import { IconChevronLeft, IconInstagram } from "../ui/icons";

const FIELD =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";
const LABEL =
  "mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50";
const CARD =
  "space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark";
const ERR = "mt-1 text-xs text-red-600 dark:text-red-400";

const STATUS_LABEL = { ACTIVE: "Active", INACTIVE: "Inactive", ARCHIVED: "Archived" } as const;

function UrlPreview({ url }: { url: string }) {
  const parsed = url.trim() ? parseInstagramUrl(url) : null;
  if (!parsed) {
    return (
      <p className="text-xs text-black/45 dark:text-white/45">
        Enter a valid Instagram post or reel link to preview it.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-admin-border bg-admin-surface p-3 dark:border-admin-border-dark dark:bg-admin-surface-dark">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
          <IconInstagram className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {parsed.postType === "REEL" ? "Reel" : "Post"}{" "}
            <span className="font-mono text-black/60 dark:text-white/60">{parsed.shortCode}</span>
          </p>
          <a
            href={parsed.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-xs text-admin-primary-dark hover:underline dark:text-admin-primary"
          >
            {parsed.canonicalUrl}
          </a>
        </div>
      </div>
      {/* Live preview via Instagram's official /embed/ endpoint — browser-only,
          no server call. Keyed on the shortcode so a URL change reloads it. */}
      <InstagramEmbed key={parsed.shortCode} shortCode={parsed.shortCode} postType={parsed.postType} />
    </div>
  );
}

export default function InstagramPostDetailClient({ id }: { id?: string }) {
  const isEdit = Boolean(id);
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useInstagramPostDetail(id ?? null);
  const createMutation = useCreateInstagramPost();
  const updateMutation = useUpdateInstagramPost(id ?? "");
  const statusMutation = useSetInstagramPostStatus(id ?? "");
  const deleteMutation = useDeleteInstagramPost();

  const [savedFlash, setSavedFlash] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<InstagramPostFormValues>({
    resolver: zodResolver(instagramPostFormSchema),
    defaultValues: { url: "", displayOrder: 0, status: "ACTIVE" },
  });

  const post = data?.post;
  const isArchived = post?.status === "ARCHIVED";

  useEffect(() => {
    if (!post) return;
    reset({
      url: post.url,
      displayOrder: post.displayOrder,
      status: post.status === "ARCHIVED" ? "INACTIVE" : post.status,
    });
  }, [post, reset]);

  const urlValue = watch("url");
  const mutation = isEdit ? updateMutation : createMutation;
  const mutationError = mutation.error instanceof ApiError ? mutation.error.message : null;

  const onSubmit = (values: InstagramPostFormValues) => {
    const parsed = instagramPostFormSchema.parse(values);
    const payload = {
      url: parsed.url,
      displayOrder: parsed.displayOrder,
      status: parsed.status,
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
        onSuccess: (res) => router.push(`/admin/instagram-posts/${res.post.id}`),
      });
    }
  };

  const runArchive = () => {
    setActionError(null);
    deleteMutation.mutate(id as string, {
      onSuccess: () => router.push("/admin/instagram-posts"),
      onError: (err) =>
        setActionError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
      onSettled: () => setArchiveOpen(false),
    });
  };

  const runRestore = () => {
    setActionError(null);
    statusMutation.mutate("ACTIVE", {
      onError: (err) =>
        setActionError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
    });
  };

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="h-72 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  if (isEdit && (isError || !data)) {
    const status = error instanceof ApiError ? error.status : 0;
    const message =
      status === 404
        ? "This Instagram post doesn't exist."
        : status === 403
          ? "You don't have permission to view this post."
          : "Couldn't load this post.";
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
            href="/admin/instagram-posts"
            className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
          >
            Back to Instagram Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/instagram-posts"
          className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Instagram Posts
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">
          {isEdit ? post?.shortCode ?? "Edit" : "Add Instagram Post"}
        </span>
        {post && <StatusBadge status={STATUS_LABEL[post.status]} />}
      </div>

      {actionError && (
        <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
          {actionError}
        </p>
      )}

      {isArchived && (
        <div className={`${CARD} sm:flex sm:items-center sm:justify-between sm:space-y-0`}>
          <p className="text-sm text-black/60 dark:text-white/60">
            This post is archived and hidden from the active list.
          </p>
          <button
            type="button"
            disabled={statusMutation.isPending}
            onClick={runRestore}
            className="mt-3 rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50 sm:mt-0"
          >
            {statusMutation.isPending ? "Restoring…" : "Restore as active"}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
        <div className="lg:col-span-2">
          <div className={CARD}>
            <div>
              <label className={LABEL}>Instagram Post URL *</label>
              <input
                {...register("url")}
                placeholder="https://www.instagram.com/p/ABC123xyz/"
                className={`${FIELD} font-mono`}
                autoFocus={!isEdit}
              />
              {errors.url && <p className={ERR}>{errors.url.message}</p>}
              <div className="mt-3">
                <UrlPreview url={urlValue ?? ""} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Display Order</label>
                <input type="number" min={0} {...register("displayOrder")} className={FIELD} />
                {errors.displayOrder && <p className={ERR}>{errors.displayOrder.message}</p>}
                <p className="mt-1 text-xs text-black/45 dark:text-white/45">
                  Lower numbers appear first. Leave as the suggested value to add to the end.
                </p>
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select {...register("status")} className={FIELD}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
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
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Save"}
            </button>
            <Link
              href="/admin/instagram-posts"
              className="rounded-full border border-admin-border px-5 py-2.5 text-center text-sm font-semibold dark:border-admin-border-dark"
            >
              Cancel
            </Link>
            {isEdit && !isArchived && (
              <button
                type="button"
                onClick={() => setArchiveOpen(true)}
                className="mt-2 rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400"
              >
                Archive post
              </button>
            )}
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive this Instagram post?"
        description="It will be hidden from the active list. You can restore it later from the Archived filter."
        confirmLabel="Archive"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={runArchive}
        onCancel={() => setArchiveOpen(false)}
      />
    </div>
  );
}
