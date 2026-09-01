"use client";

import { useMemo, useState } from "react";
import { useBlogTags } from "@/lib/hooks/admin/useBlogTaxonomy";
import { IconClose } from "../ui/icons";

// A chip input over a string[] of tag *names*. The backend upserts unknown
// names to BlogTag docs on save (see blog.validation.ts's `tags` field), so
// this never needs to create a tag itself — it just offers existing ones as
// suggestions and lets the admin add new names inline.
export default function BlogTagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const { data } = useBlogTags(query.trim());

  const suggestions = useMemo(() => {
    const lowerSelected = new Set(value.map((t) => t.toLowerCase()));
    return (data?.tags ?? [])
      .filter((t) => !lowerSelected.has(t.name.toLowerCase()))
      .slice(0, 8);
  }, [data, value]);

  const add = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    if (value.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setQuery("");
      return;
    }
    if (value.length >= 30) return;
    onChange([...value, clean]);
    setQuery("");
  };

  const remove = (name: string) => onChange(value.filter((t) => t !== name));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-admin-border bg-admin-surface p-2 dark:border-admin-border-dark dark:bg-admin-surface-dark">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-admin-primary/40 px-2.5 py-1 text-xs font-semibold text-black dark:bg-admin-primary/25 dark:text-white"
          >
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => remove(tag)}>
              <IconClose className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(query);
            } else if (e.key === "Backspace" && !query && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length ? "Add another…" : "Type a tag and press Enter"}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
        />
      </div>

      {query.trim() && suggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s.tagId}
              type="button"
              onClick={() => add(s.name)}
              className="rounded-full border border-admin-border px-2.5 py-1 text-xs font-semibold text-black/60 hover:bg-admin-primary/20 dark:border-admin-border-dark dark:text-white/60 dark:hover:bg-admin-primary/10"
            >
              + {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
