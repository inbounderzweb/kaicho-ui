"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { BlogFormValues } from "@/lib/validation/blog.schema";
import BlogImagePicker, { type PickedBlogImage } from "./BlogImagePicker";

const inputClass =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";
const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50";

function CharCount({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span className={`text-[11px] font-semibold tabular-nums ${over ? "text-red-600 dark:text-red-400" : "text-black/40 dark:text-white/40"}`}>
      {value.length}/{limit}
    </span>
  );
}

export default function BlogSeoPanel({
  register,
  errors,
  values,
  ogImage,
  onOgImageChange,
  autoCanonical,
}: {
  register: UseFormRegister<BlogFormValues>;
  errors: FieldErrors<BlogFormValues>;
  values: Pick<BlogFormValues, "metaTitle" | "metaDescription" | "focusKeyword" | "ogTitle" | "ogDescription">;
  ogImage: PickedBlogImage | null;
  onOgImageChange: (img: PickedBlogImage | null) => void;
  autoCanonical: string;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <div>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
          Search engine optimization
        </h2>
        <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
          Lengths below are practical guidance, not hard limits — Google may still truncate or rewrite them.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={labelClass}>Meta title</label>
          <CharCount value={values.metaTitle ?? ""} limit={60} />
        </div>
        <input {...register("metaTitle")} placeholder="Falls back to the post title" className={inputClass} />
        {errors.metaTitle && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.metaTitle.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={labelClass}>Meta description</label>
          <CharCount value={values.metaDescription ?? ""} limit={160} />
        </div>
        <textarea {...register("metaDescription")} rows={3} placeholder="Falls back to the excerpt" className={inputClass} />
        {errors.metaDescription && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.metaDescription.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Focus keyword</label>
        <input {...register("focusKeyword")} placeholder="One primary phrase" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Canonical URL</label>
        <input {...register("canonicalUrl")} placeholder={autoCanonical} className={inputClass} />
        {errors.canonicalUrl && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.canonicalUrl.message}</p>
        )}
        <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
          Leave blank to use <span className="font-mono">{autoCanonical}</span>
        </p>
      </div>

      <fieldset className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-admin-border px-3 py-2 text-sm font-semibold dark:border-admin-border-dark">
          <input type="checkbox" {...register("noIndex")} className="h-4 w-4 rounded" />
          No Index
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-admin-border px-3 py-2 text-sm font-semibold dark:border-admin-border-dark">
          <input type="checkbox" {...register("noFollow")} className="h-4 w-4 rounded" />
          No Follow
        </label>
      </fieldset>
      <p className="-mt-2 text-[11px] text-black/45 dark:text-white/45">Default: Index, Follow.</p>

      <div className="space-y-3 border-t border-admin-border pt-4 dark:border-admin-border-dark">
        <p className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Open Graph</p>
        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>OG title</label>
            <CharCount value={values.ogTitle ?? ""} limit={95} />
          </div>
          <input {...register("ogTitle")} placeholder="Falls back to the meta title" className={inputClass} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>OG description</label>
            <CharCount value={values.ogDescription ?? ""} limit={200} />
          </div>
          <textarea {...register("ogDescription")} rows={2} placeholder="Falls back to the meta description" className={inputClass} />
        </div>
        <BlogImagePicker
          label="OG image"
          recommended="1200 × 630px"
          value={ogImage}
          onChange={onOgImageChange}
        />
        <p className="text-[11px] text-black/45 dark:text-white/45">Falls back to the featured image.</p>
      </div>
    </div>
  );
}
