"use client";

import { useEffect, useState } from "react";
import type { BlogTocItem } from "@/lib/api/blog";

// Renders the server-built table of contents and tracks which section is in
// view. Heading ids are injected server-side (kaicho-be blog.content.ts), so
// the anchors are stable across renders.
export default function BlogToc({ items }: { items: BlogTocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="rounded-2xl border border-border bg-cream/50 p-5">
      <p className="font-display text-sm font-bold uppercase tracking-wide text-ink">On this page</p>
      <ol className="mt-3 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, "", `#${item.id}`);
              }}
              className={`block leading-snug transition-colors ${
                activeId === item.id ? "font-semibold text-brand" : "text-ink-muted hover:text-ink"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
