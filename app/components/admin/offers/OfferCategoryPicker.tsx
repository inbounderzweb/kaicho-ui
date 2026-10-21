"use client";

import { useMemo, useState } from "react";
import { useCategoryOptions } from "@/lib/hooks/admin/useCategoryOptions";

// Checkbox list over the existing category options endpoint. Sub-categories
// are indented under their parent. Picking a parent covers its sub-categories
// too (the server expands descendants), which the hint states.
export default function OfferCategoryPicker({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const { data: options, isLoading } = useCategoryOptions();
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    if (!options) return [];
    const byParent = new Map<string | null, typeof options>();
    for (const o of options) {
      const list = byParent.get(o.parentId) ?? [];
      list.push(o);
      byParent.set(o.parentId, list);
    }
    const out: { id: string; name: string; depth: number }[] = [];
    const walk = (parent: string | null, depth: number, seen: Set<string>) => {
      for (const o of byParent.get(parent) ?? []) {
        if (seen.has(o.id)) continue;
        seen.add(o.id);
        out.push({ id: o.id, name: o.name, depth });
        walk(o.id, depth + 1, seen);
      }
    };
    walk(null, 0, new Set());
    return out;
  }, [options]);

  const shown = filter.trim()
    ? rows.filter((r) => r.name.toLowerCase().includes(filter.trim().toLowerCase()))
    : rows;
  const selected = new Set(value);

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">{label}</p>
      {hint && <p className="mb-2 text-[11px] text-black/45 dark:text-white/45">{hint}</p>}
      <input
        type="text"
        value={filter}
        disabled={disabled}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter categories…"
        className="mb-2 w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
      />
      <div className="max-h-48 overflow-y-auto rounded-xl border border-admin-border p-1 dark:border-admin-border-dark">
        {isLoading ? (
          <p className="p-2 text-xs text-black/50 dark:text-white/50">Loading categories…</p>
        ) : shown.length === 0 ? (
          <p className="p-2 text-xs text-black/50 dark:text-white/50">No categories found.</p>
        ) : (
          shown.map((r) => (
            <label
              key={r.id}
              style={{ paddingLeft: `${0.5 + (filter ? 0 : r.depth) * 1}rem` }}
              className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pr-2 text-sm hover:bg-admin-primary/10"
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={selected.has(r.id)}
                onChange={(e) => onChange(e.target.checked ? [...value, r.id] : value.filter((x) => x !== r.id))}
                className="h-4 w-4 accent-[var(--color-admin-primary-dark,#16a34a)]"
              />
              <span className="truncate">{r.name}</span>
            </label>
          ))
        )}
      </div>
      {value.length > 0 && (
        <p className="mt-1 text-[11px] text-black/50 dark:text-white/50">{value.length} selected</p>
      )}
    </div>
  );
}
