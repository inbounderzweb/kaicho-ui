import { SITE_URL } from "@/lib/seo/urls";

// A Google-style SERP snippet. Purely illustrative — it does not promise
// rankings, just shows how the entered title/description are likely to appear.
function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export default function SeoPreview({
  title,
  description,
  slug,
}: {
  title: string;
  description: string;
  slug: string;
}) {
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const shownTitle = clamp(title || "Untitled post", 60);
  const shownDesc = clamp(description || "Add a meta description or excerpt to control this preview text.", 160);

  return (
    <div className="rounded-xl border border-admin-border bg-white p-4 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <p className="text-xs text-black/45 dark:text-white/45">Search result preview</p>
      <div className="mt-2">
        <p className="flex items-center gap-1 text-xs text-emerald-800 dark:text-emerald-400">
          <span>{host}</span>
          <span className="text-black/30 dark:text-white/30">›</span>
          <span>blog</span>
          <span className="text-black/30 dark:text-white/30">›</span>
          <span className="truncate">{slug || "your-post-slug"}</span>
        </p>
        <p className="mt-0.5 text-lg leading-tight text-[#1a0dab] dark:text-[#8ab4f8]">{shownTitle}</p>
        <p className="mt-1 text-sm leading-snug text-black/70 dark:text-white/70">{shownDesc}</p>
      </div>
    </div>
  );
}
