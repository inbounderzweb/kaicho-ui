"use client";

import { useEffect, useRef } from "react";
import type { InstagramPost } from "@/lib/api/instagramPost";
import InstagramEmbed from "./InstagramEmbed";
import { IconClose } from "../ui/icons";

// Small popup that renders the live Instagram embed for one post — the same
// browser-only embed.js preview used on the detail form, in a modal so it can
// be checked straight from the list without opening the edit page. Mirrors
// ConfirmDialog's modal mechanics (backdrop click, Escape, scroll lock).
export default function InstagramPreviewModal({
  open,
  post,
  onClose,
}: {
  open: boolean;
  post: Pick<InstagramPost, "url" | "shortCode" | "postType"> | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of Instagram ${post.postType === "REEL" ? "reel" : "post"} ${post.shortCode}`}
        tabIndex={-1}
        className="relative w-full max-w-90 rounded-2xl border border-admin-border bg-admin-card p-4 shadow-xl dark:border-admin-border-dark dark:bg-admin-card-dark"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-bold">
            {post.postType === "REEL" ? "Reel" : "Post"}{" "}
            <span className="font-mono text-black/55 dark:text-white/55">{post.shortCode}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center">
          <InstagramEmbed key={post.shortCode} shortCode={post.shortCode} postType={post.postType} />
        </div>

        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block truncate text-center text-xs text-admin-primary-dark hover:underline dark:text-admin-primary"
        >
          Open on Instagram
        </a>
      </div>
    </div>
  );
}
