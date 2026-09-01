import type { BlogStatus, BlogSeoReadiness } from "@/lib/api/blog";

// Same colour vocabulary and pill shape as OrderStatusBadge so the admin
// doesn't look like two different systems side by side.
const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
const fallback = "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70";

const STATUS_STYLES: Record<BlogStatus, string> = {
  DRAFT: "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70",
  SCHEDULED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  PUBLISHED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  ARCHIVED: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const STATUS_LABELS: Record<BlogStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function BlogStatusBadge({ status }: { status: BlogStatus }) {
  return <span className={`${base} ${STATUS_STYLES[status] ?? fallback}`}>{STATUS_LABELS[status] ?? status}</span>;
}

const SEO_STYLES: Record<BlogSeoReadiness, string> = {
  good: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "needs-work": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  poor: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const SEO_LABELS: Record<BlogSeoReadiness, string> = {
  good: "Good",
  "needs-work": "Needs work",
  poor: "Poor",
};

export function SeoStatusBadge({ readiness, score }: { readiness: BlogSeoReadiness; score?: number }) {
  return (
    <span className={`${base} ${SEO_STYLES[readiness] ?? fallback}`} title={score !== undefined ? `SEO score ${score}/100` : undefined}>
      {SEO_LABELS[readiness] ?? readiness}
    </span>
  );
}
