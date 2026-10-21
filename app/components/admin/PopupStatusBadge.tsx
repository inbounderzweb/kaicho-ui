import type { PopupEffectiveState } from "@/lib/api/popup";

const STYLES: Record<PopupEffectiveState, { label: string; cls: string }> = {
  LIVE: { label: "Live", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  SCHEDULED: { label: "Scheduled", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-400" },
  EXPIRED: { label: "Expired", cls: "bg-red-500/15 text-red-700 dark:text-red-400" },
  PAUSED: { label: "Paused", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  DRAFT: { label: "Draft", cls: "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70" },
  PUBLISHED: { label: "Published", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  ARCHIVED: { label: "Archived", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-400" },
};

export default function PopupStatusBadge({ state }: { state: PopupEffectiveState }) {
  const s = STYLES[state];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}
