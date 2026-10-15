"use client";

export default function DraftBanner({
  restoredAt,
  onDiscard,
}: {
  restoredAt: number | null;
  onDiscard: () => void;
}) {
  if (restoredAt === null) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <p>
        <span className="font-semibold">Unsaved draft restored</span>
        <span className="text-black/60 dark:text-white/60">
          {" "}
          — from {new Date(restoredAt).toLocaleString()}. Save to keep it.
        </span>
      </p>
      <button
        type="button"
        onClick={onDiscard}
        className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold hover:opacity-80 dark:border-admin-border-dark"
      >
        Discard draft
      </button>
    </div>
  );
}
