// Semantic status color, intentionally separate from the admin panel's
// accent hue (#D2DCB6) — status meaning shouldn't compete with brand color.
const STATUS_STYLES: Record<string, string> = {
  Delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "In stock": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",

  "On the way": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Low stock": "bg-amber-500/15 text-amber-700 dark:text-amber-400",

  Cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
  "Out of stock": "bg-red-500/15 text-red-700 dark:text-red-400",
  Inactive: "bg-red-500/15 text-red-700 dark:text-red-400",

  Processing: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}
