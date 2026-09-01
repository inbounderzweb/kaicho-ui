import type { SeoChecklistResult, SeoReadiness } from "@/lib/seo/blog-checklist";
import { IconCheck, IconClose } from "../ui/icons";

const READINESS_LABEL: Record<SeoReadiness, string> = {
  good: "Good",
  "needs-work": "Needs work",
  poor: "Poor",
};

const READINESS_STYLE: Record<SeoReadiness, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  "needs-work": "text-amber-700 dark:text-amber-400",
  poor: "text-red-700 dark:text-red-400",
};

function Counter({ label, count, limit }: { label: string; count: number; limit: number }) {
  const over = count > limit;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-black/55 dark:text-white/55">{label}</span>
      <span className={`font-semibold tabular-nums ${over ? "text-red-600 dark:text-red-400" : "text-black/70 dark:text-white/70"}`}>
        {count} / {limit}
      </span>
    </div>
  );
}

export default function SeoChecklist({
  result,
  metaTitleLength,
  metaDescriptionLength,
  slugLength,
  missingImageAlt,
}: {
  result: SeoChecklistResult;
  metaTitleLength: number;
  metaDescriptionLength: number;
  slugLength: number;
  missingImageAlt: boolean;
}) {
  return (
    <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
          SEO checklist
        </h3>
        <span className={`text-sm font-bold ${READINESS_STYLE[result.readiness]}`}>
          {READINESS_LABEL[result.readiness]} · {result.passedCount}/{result.totalCount}
        </span>
      </div>

      <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">
        Practical on-page guidance — not a ranking guarantee.
      </p>

      <div className="mt-3 space-y-1.5 border-b border-admin-border pb-3 dark:border-admin-border-dark">
        <Counter label="Meta title length" count={metaTitleLength} limit={60} />
        <Counter label="Meta description length" count={metaDescriptionLength} limit={160} />
        <Counter label="Slug length" count={slugLength} limit={75} />
      </div>

      <ul className="mt-3 space-y-1.5">
        {result.items.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-xs">
            {item.passed ? (
              <IconCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <IconClose className="h-3.5 w-3.5 shrink-0 text-black/30 dark:text-white/30" />
            )}
            <span className={item.passed ? "text-black/70 dark:text-white/70" : "text-black/45 dark:text-white/45"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {missingImageAlt && (
        <p className="mt-3 rounded-lg bg-amber-500/10 p-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
          One or more images are missing alt text.
        </p>
      )}
    </div>
  );
}
