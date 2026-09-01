"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { blogFormSchema, type BlogFormValues } from "@/lib/validation/blog.schema";
import { ApiError } from "@/lib/api/ApiError";
import {
  setBlogStatus as apiSetBlogStatus,
  scheduleBlog as apiScheduleBlog,
  type AdminBlogDetail,
  type BlogFormInput,
  type BlogStatus,
} from "@/lib/api/blog";
import { blogKeys } from "@/lib/hooks/query-keys";
import { useBlogDetail } from "@/lib/hooks/admin/useBlogQueries";
import { useCreateBlog, useUpdateBlog, useDeleteBlog } from "@/lib/hooks/admin/useBlogMutations";
import { useBlogCategoryOptions } from "@/lib/hooks/admin/useBlogTaxonomy";
import { computeBlogSeoChecklist } from "@/lib/seo/blog-checklist";
import { absoluteUrl } from "@/lib/seo/urls";
import RichTextEditor from "./RichTextEditor";
import BlogImagePicker, { type PickedBlogImage } from "./BlogImagePicker";
import BlogSeoPanel from "./BlogSeoPanel";
import SeoPreview from "./SeoPreview";
import SeoChecklist from "./SeoChecklist";
import BlogTagInput from "./BlogTagInput";
import ConfirmDialog from "./ConfirmDialog";
import { BlogStatusBadge } from "./BlogStatusBadge";
import { IconChevronLeft, IconEye, IconClose } from "../ui/icons";

const inputClass =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50";
const cardClass =
  "space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark";

function slugifyClient(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toImage(img: AdminBlogDetail["featuredImage"]): PickedBlogImage | null {
  return img
    ? { mediaId: img.mediaId, url: img.url, thumbnailUrl: img.thumbnailUrl, altText: img.altText ?? "" }
    : null;
}

const EMPTY_DEFAULTS: BlogFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  categoryId: "",
  authorName: "",
  author: "",
  contentHtml: "",
  tags: [],
  faqs: [],
  relatedBlogIds: [],
  featuredImageMediaId: "",
  thumbnailImageMediaId: "",
  ogImageMediaId: "",
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  noIndex: false,
  noFollow: false,
  schemaEnabled: true,
};

export default function BlogEditorClient({ id }: { id?: string }) {
  const isEdit = Boolean(id);
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useBlogDetail(id ?? null);
  const blog = data?.blog;

  const { data: categoryOptions } = useBlogCategoryOptions();

  const queryClient = useQueryClient();
  const createMutation = useCreateBlog();
  const updateMutation = useUpdateBlog(id ?? "");
  const deleteMutation = useDeleteBlog();
  const [transitionPending, setTransitionPending] = useState(false);

  const [featuredImage, setFeaturedImage] = useState<PickedBlogImage | null>(null);
  const [thumbnailImage, setThumbnailImage] = useState<PickedBlogImage | null>(null);
  const [ogImage, setOgImage] = useState<PickedBlogImage | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [savedFlash, setSavedFlash] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  // Hydrate from fetched data (edit / duplicate landing).
  useEffect(() => {
    if (!blog) return;
    reset({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      categoryId: blog.category?.categoryId ?? "",
      authorName: blog.author?.name ?? "",
      author: blog.author?.userId ?? "",
      contentHtml: blog.contentHtml ?? "",
      tags: blog.tags.map((t) => t.name),
      faqs: blog.faqs ?? [],
      relatedBlogIds: blog.relatedBlogIds ?? [],
      featuredImageMediaId: blog.featuredImage?.mediaId ?? "",
      thumbnailImageMediaId: blog.thumbnailImage?.mediaId ?? "",
      ogImageMediaId: blog.seo.ogImage?.mediaId ?? "",
      metaTitle: blog.seo.metaTitle,
      metaDescription: blog.seo.metaDescription,
      focusKeyword: blog.seo.focusKeyword,
      canonicalUrl: blog.seo.canonicalUrl,
      ogTitle: blog.seo.ogTitle,
      ogDescription: blog.seo.ogDescription,
      noIndex: blog.seo.noIndex,
      noFollow: blog.seo.noFollow,
      schemaEnabled: blog.schemaEnabled,
    });
    setFeaturedImage(toImage(blog.featuredImage));
    setThumbnailImage(toImage(blog.thumbnailImage));
    setOgImage(toImage(blog.seo.ogImage));
  }, [blog, reset]);

  // Keep hidden media-id fields in step with the pickers so isDirty tracks
  // them — but only mark dirty when the value genuinely changes, so hydrating
  // the pickers on load doesn't spuriously trip the unsaved-changes guard.
  const syncMediaField = (
    field: "featuredImageMediaId" | "thumbnailImageMediaId" | "ogImageMediaId",
    mediaId: string
  ) => {
    if (watch(field) !== mediaId) setValue(field, mediaId, { shouldDirty: true });
  };
  useEffect(() => {
    syncMediaField("featuredImageMediaId", featuredImage?.mediaId ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredImage]);
  useEffect(() => {
    syncMediaField("thumbnailImageMediaId", thumbnailImage?.mediaId ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbnailImage]);
  useEffect(() => {
    syncMediaField("ogImageMediaId", ogImage?.mediaId ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ogImage]);

  const titleValue = watch("title");
  useEffect(() => {
    if (isEdit || slugTouched) return;
    const t = setTimeout(() => setValue("slug", slugifyClient(titleValue || "")), 0);
    return () => clearTimeout(t);
  }, [titleValue, isEdit, slugTouched, setValue]);

  // Unsaved-changes guard.
  const dirtyRef = useRef(false);
  dirtyRef.current = isDirty;
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const v = watch();
  const checklist = useMemo(
    () =>
      computeBlogSeoChecklist({
        title: v.title,
        slug: v.slug || "",
        excerpt: v.excerpt,
        metaTitle: v.metaTitle,
        metaDescription: v.metaDescription,
        focusKeyword: v.focusKeyword,
        canonicalUrl: v.canonicalUrl,
        contentHtml: v.contentHtml,
        hasFeaturedImage: Boolean(featuredImage),
        featuredImageAlt: featuredImage?.altText ?? null,
      }),
    [v, featuredImage]
  );

  const autoCanonical = absoluteUrl(`/blog/${v.slug || "your-post-slug"}`);
  const status: BlogStatus | null = blog?.status ?? null;
  const slugChangedWhilePublished = isEdit && status === "PUBLISHED" && blog && v.slug !== blog.slug;

  const anyPending = createMutation.isPending || updateMutation.isPending || transitionPending;

  function buildPayload(values: BlogFormValues): BlogFormInput {
    return {
      title: values.title.trim(),
      slug: values.slug || undefined,
      excerpt: values.excerpt.trim(),
      categoryId: values.categoryId,
      author: values.author || undefined,
      authorName: values.authorName?.trim() || undefined,
      contentHtml: values.contentHtml,
      tags: values.tags,
      faqs: values.faqs.filter((f) => f.question.trim() && f.answer.trim()),
      relatedBlogIds: values.relatedBlogIds,
      featuredImageMediaId: featuredImage?.mediaId ?? null,
      thumbnailImageMediaId: thumbnailImage?.mediaId ?? null,
      schemaEnabled: values.schemaEnabled,
      seo: {
        metaTitle: values.metaTitle || undefined,
        metaDescription: values.metaDescription || undefined,
        focusKeyword: values.focusKeyword || undefined,
        canonicalUrl: values.canonicalUrl || undefined,
        ogTitle: values.ogTitle || undefined,
        ogDescription: values.ogDescription || undefined,
        ogImageMediaId: ogImage?.mediaId || undefined,
        noIndex: values.noIndex,
        noFollow: values.noFollow,
      },
    };
  }

  // Persist the current form, returning the blog id (creating if needed).
  async function persist(values: BlogFormValues): Promise<string> {
    const payload = buildPayload(values);
    if (isEdit && id) {
      await updateMutation.mutateAsync(payload);
      return id;
    }
    const res = await createMutation.mutateAsync(payload);
    return res.blog.blogId;
  }

  const flash = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  const onSaveOnly = handleSubmit(async (values) => {
    setActionError(null);
    try {
      const savedId = await persist(values);
      reset(values, { keepValues: true });
      if (!isEdit) router.push(`/admin/blogs/${savedId}`);
      else flash();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't save. Please try again.");
    }
  });

  const afterTransition = (savedId: string, values: BlogFormValues) => {
    queryClient.invalidateQueries({ queryKey: ["admin", "blogs", "list"] });
    queryClient.invalidateQueries({ queryKey: blogKeys.detail(savedId) });
    reset(values, { keepValues: true });
    if (!isEdit) router.push(`/admin/blogs/${savedId}`);
    else {
      refetch();
      flash();
    }
  };

  const runTransition = (target: BlogStatus, note?: string) =>
    handleSubmit(async (values) => {
      setActionError(null);
      setTransitionPending(true);
      try {
        const savedId = await persist(values);
        await apiSetBlogStatus(savedId, { status: target, note });
        afterTransition(savedId, values);
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : "Action failed. Please try again.");
      } finally {
        setTransitionPending(false);
      }
    })();

  const submitSchedule = handleSubmit(async (values) => {
    if (!scheduleDate || !scheduleTime) {
      setActionError("Pick a date and time to schedule.");
      return;
    }
    const when = new Date(`${scheduleDate}T${scheduleTime}`);
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      setActionError("The scheduled time must be in the future.");
      return;
    }
    setActionError(null);
    setTransitionPending(true);
    try {
      const savedId = await persist(values);
      await apiScheduleBlog(savedId, { scheduledFor: when.toISOString() });
      setScheduleOpen(false);
      afterTransition(savedId, values);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't schedule. Please try again.");
    } finally {
      setTransitionPending(false);
    }
  });

  // ---- render ----

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="h-96 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  if (isEdit && (isError || !blog)) {
    const st = error instanceof ApiError ? error.status : 0;
    return (
      <div className={`${cardClass} flex-col items-start`}>
        <p className="text-sm font-semibold">
          {st === 404 ? "This post doesn't exist, or isn't reachable from here." : "Couldn't load this post."}
        </p>
        <div className="flex gap-2">
          {st !== 404 && (
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
            >
              Retry
            </button>
          )}
          <Link
            href="/admin/blogs"
            className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
          >
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  const tzName = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "local time";
  const faqs = watch("faqs");

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/blogs"
          className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Blogs
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">{isEdit ? blog?.title ?? "Edit" : "New Blog"}</span>
        {status && <BlogStatusBadge status={status} />}
      </div>

      <form onSubmit={onSaveOnly} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 1 — Blog Information */}
          <section className={cardClass}>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
              Blog information
            </h2>

            <div>
              <label className={labelClass}>Title *</label>
              <input {...register("title")} className={inputClass} />
              {errors.title && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Slug *</label>
              <input
                {...register("slug", { onChange: () => setSlugTouched(true) })}
                placeholder="auto-generated-from-title"
                className={inputClass}
              />
              {errors.slug && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.slug.message}</p>}
              {slugChangedWhilePublished && (
                <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Changing a published post&apos;s slug changes its public URL. The old URL will 301-redirect, but
                  update any hard-coded links.
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Excerpt *</label>
              <textarea {...register("excerpt")} rows={2} className={inputClass} />
              {errors.excerpt && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.excerpt.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Category *</label>
                <select {...register("categoryId")} className={inputClass}>
                  <option value="">Select a category…</option>
                  {(categoryOptions ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.categoryId.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Author name</label>
                <input
                  {...register("authorName")}
                  placeholder="Enter author name"
                  className={inputClass}
                />
                {errors.authorName && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.authorName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>Tags</label>
              <BlogTagInput value={watch("tags")} onChange={(t) => setValue("tags", t, { shouldDirty: true })} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BlogImagePicker
                label="Featured image"
                recommended="1600 × 900px"
                value={featuredImage}
                onChange={setFeaturedImage}
              />
              <BlogImagePicker
                label="Thumbnail image"
                recommended="800 × 800px"
                value={thumbnailImage}
                onChange={setThumbnailImage}
              />
            </div>
            <p className="text-[11px] text-black/45 dark:text-white/45">
              A featured image (with alt text) and body content are required before publishing.
            </p>
          </section>

          {/* Section 2 — Content */}
          <section className={cardClass}>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
              Content
            </h2>
            <RichTextEditor
              value={watch("contentHtml")}
              onChange={(html) => setValue("contentHtml", html, { shouldDirty: true })}
            />
          </section>

          {/* Section 3 — FAQ */}
          <section className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
                FAQ (optional)
              </h2>
              <button
                type="button"
                onClick={() => setValue("faqs", [...faqs, { question: "", answer: "" }], { shouldDirty: true })}
                className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold dark:border-admin-border-dark"
              >
                + Add question
              </button>
            </div>
            {faqs.length === 0 && (
              <p className="text-xs text-black/45 dark:text-white/45">
                Add Q&amp;A pairs only if they appear on the page — they drive the FAQ structured data.
              </p>
            )}
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-admin-border p-3 dark:border-admin-border-dark">
                  <div className="flex items-start gap-2">
                    <input
                      value={faq.question}
                      onChange={(e) => {
                        const next = [...faqs];
                        next[i] = { ...next[i], question: e.target.value };
                        setValue("faqs", next, { shouldDirty: true });
                      }}
                      placeholder="Question"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      aria-label="Remove question"
                      onClick={() => setValue("faqs", faqs.filter((_, idx) => idx !== i), { shouldDirty: true })}
                      className="mt-1 text-black/40 hover:text-red-600 dark:text-white/40"
                    >
                      <IconClose className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => {
                      const next = [...faqs];
                      next[i] = { ...next[i], answer: e.target.value };
                      setValue("faqs", next, { shouldDirty: true });
                    }}
                    placeholder="Answer"
                    rows={2}
                    className={`${inputClass} mt-2`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 — SEO */}
          <BlogSeoPanel
            register={register}
            errors={errors}
            values={{
              metaTitle: v.metaTitle,
              metaDescription: v.metaDescription,
              focusKeyword: v.focusKeyword,
              ogTitle: v.ogTitle,
              ogDescription: v.ogDescription,
            }}
            ogImage={ogImage}
            onOgImageChange={setOgImage}
            autoCanonical={autoCanonical}
          />

          <SeoPreview
            title={v.metaTitle || v.title}
            description={v.metaDescription || v.excerpt}
            slug={v.slug || ""}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className={cardClass}>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
                Publishing
              </h2>

              {actionError && (
                <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                  {actionError}
                </p>
              )}
              {savedFlash && (
                <p className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Saved.
                </p>
              )}

              <button
                type="submit"
                disabled={anyPending}
                className="w-full rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {anyPending ? "Saving…" : isEdit ? "Save changes" : "Save draft"}
              </button>

              {status !== "PUBLISHED" && (
                <button
                  type="button"
                  disabled={anyPending}
                  onClick={() => runTransition("PUBLISHED")}
                  className="w-full rounded-full border border-admin-primary-dark px-5 py-2.5 text-sm font-semibold text-admin-primary-dark transition-colors hover:bg-admin-primary/20 disabled:opacity-50 dark:border-admin-primary dark:text-admin-primary"
                >
                  {status === "SCHEDULED" ? "Publish now" : "Publish"}
                </button>
              )}

              {status !== "PUBLISHED" && status !== "SCHEDULED" && (
                <button
                  type="button"
                  disabled={anyPending}
                  onClick={() => {
                    setScheduleOpen((o) => !o);
                    setActionError(null);
                  }}
                  className="w-full rounded-full border border-admin-border px-5 py-2.5 text-sm font-semibold disabled:opacity-50 dark:border-admin-border-dark"
                >
                  Schedule…
                </button>
              )}

              {scheduleOpen && (
                <div className="space-y-2 rounded-xl border border-admin-border p-3 dark:border-admin-border-dark">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <p className="text-[11px] text-black/45 dark:text-white/45">Timezone: {tzName}</p>
                  <button
                    type="button"
                    disabled={anyPending}
                    onClick={() => submitSchedule()}
                    className="w-full rounded-full bg-admin-primary px-4 py-2 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
                  >
                    Confirm schedule
                  </button>
                </div>
              )}

              {status === "PUBLISHED" && (
                <button
                  type="button"
                  disabled={anyPending}
                  onClick={() => runTransition("DRAFT")}
                  className="w-full rounded-full border border-admin-border px-5 py-2.5 text-sm font-semibold disabled:opacity-50 dark:border-admin-border-dark"
                >
                  Unpublish
                </button>
              )}

              {isEdit && (
                <a
                  href={`/admin/blogs/${id}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-full border border-admin-border px-5 py-2.5 text-sm font-semibold dark:border-admin-border-dark"
                >
                  <IconEye className="h-4 w-4" />
                  Preview
                </a>
              )}

              {isEdit && status !== "ARCHIVED" && (
                <button
                  type="button"
                  disabled={anyPending}
                  onClick={() => runTransition("ARCHIVED")}
                  className="w-full rounded-full border border-amber-500/30 px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-400"
                >
                  Archive
                </button>
              )}

              {isEdit && (
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="w-full rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400"
                >
                  Delete
                </button>
              )}

              <label className="flex items-center gap-2 pt-1 text-xs font-semibold">
                <input type="checkbox" {...register("schemaEnabled")} className="h-4 w-4 rounded" />
                Emit BlogPosting structured data
              </label>
            </div>

            <SeoChecklist
              result={checklist}
              metaTitleLength={(v.metaTitle || "").length}
              metaDescriptionLength={(v.metaDescription || "").length}
              slugLength={(v.slug || "").length}
              missingImageAlt={Boolean(featuredImage) && !featuredImage?.altText?.trim()}
            />
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this post?"
        description="It will be archived (removed from the public blog, kept here). You can restore it to draft later."
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          if (!id) return;
          deleteMutation.mutate(
            { id },
            {
              onSuccess: () => router.push("/admin/blogs"),
              onError: (err) =>
                setActionError(err instanceof ApiError ? err.message : "Couldn't delete. Please try again."),
            }
          );
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
