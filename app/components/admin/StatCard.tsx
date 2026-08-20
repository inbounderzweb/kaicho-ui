export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <p className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums text-black dark:text-white">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-black/45 dark:text-white/45">{hint}</p>}
    </div>
  );
}
