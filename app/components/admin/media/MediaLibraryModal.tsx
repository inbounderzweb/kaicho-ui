"use client";

import { useEffect, useState } from "react";
import type { AdminMedia, UploadedMedia } from "@/lib/api/media";
import { IconClose } from "../../ui/icons";
import MediaBrowser, { DEFAULT_MEDIA_FILTERS, type MediaBrowserFilters } from "./MediaBrowser";
import MediaUploadPanel from "./MediaUploadPanel";

// The "Upload New + Choose from Library" dialog that every image field opens.
// Selection lives here; on confirm it hands the chosen assets back to the
// field, which drops them into the form exactly as a fresh upload would.

export interface MediaPick {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
  altText: string | null;
  width?: number;
  height?: number;
}

function toPick(m: AdminMedia | UploadedMedia): MediaPick {
  return {
    mediaId: m.mediaId,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl,
    altText: "altText" in m ? m.altText : null,
    width: m.width,
    height: m.height,
  };
}

export default function MediaLibraryModal({
  open,
  mode,
  maxSelection,
  onClose,
  onConfirm,
}: {
  open: boolean;
  mode: "single" | "multiple";
  /** Cap for multi-select (e.g. remaining gallery slots). */
  maxSelection?: number;
  onClose: () => void;
  onConfirm: (picks: MediaPick[]) => void;
}) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [filters, setFilters] = useState<MediaBrowserFilters>(DEFAULT_MEDIA_FILTERS);
  const [selected, setSelected] = useState<Map<string, AdminMedia>>(new Map());

  // Reset every time the dialog is (re)opened. Deferred a tick so the state
  // updates don't run synchronously inside the effect body.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      setTab("library");
      setFilters(DEFAULT_MEDIA_FILTERS);
      setSelected(new Map());
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const cap = mode === "single" ? 1 : maxSelection ?? Infinity;

  const toggle = (item: AdminMedia) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.mediaId)) {
        next.delete(item.mediaId);
        return next;
      }
      if (mode === "single") {
        return new Map([[item.mediaId, item]]);
      }
      if (next.size >= cap) return prev;
      next.set(item.mediaId, item);
      return next;
    });
  };

  const confirm = (extra?: MediaPick[]) => {
    const picks = extra ?? [...selected.values()].map(toPick);
    if (picks.length === 0) return;
    onConfirm(mode === "single" ? picks.slice(0, 1) : picks);
    onClose();
  };

  const handleUploaded = (items: UploadedMedia[]) => {
    // A fresh upload is an immediate pick — no need to hunt for it in the grid.
    confirm(items.map(toPick));
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-admin-border bg-admin-card shadow-xl dark:border-admin-border-dark dark:bg-admin-card-dark sm:h-[80vh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-admin-border px-4 py-3 dark:border-admin-border-dark">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setTab("library")}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                tab === "library"
                  ? "bg-admin-primary/20 text-black dark:bg-admin-primary/10 dark:text-white"
                  : "text-black/55 hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10"
              }`}
            >
              Choose from Library
            </button>
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                tab === "upload"
                  ? "bg-admin-primary/20 text-black dark:bg-admin-primary/10 dark:text-white"
                  : "text-black/55 hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10"
              }`}
            >
              Upload New
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "library" ? (
            <MediaBrowser
              filters={filters}
              onFilters={(patch, resetPage = true) =>
                setFilters((f) => ({ ...f, ...patch, page: resetPage ? 1 : patch.page ?? f.page }))
              }
              selectable={mode}
              selectedIds={[...selected.keys()]}
              onToggleSelect={toggle}
              restrictKind="IMAGE"
            />
          ) : (
            <MediaUploadPanel imagesOnly multiple={mode === "multiple"} onUploaded={handleUploaded} />
          )}
        </div>

        {/* Footer */}
        {tab === "library" && (
          <div className="flex items-center justify-between gap-3 border-t border-admin-border px-4 py-3 dark:border-admin-border-dark">
            <p className="text-xs text-black/55 dark:text-white/55">
              {selected.size > 0
                ? `${selected.size} selected${cap !== Infinity ? ` / ${cap}` : ""}`
                : "Select an image"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-admin-border px-4 py-2 text-sm font-semibold dark:border-admin-border-dark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirm()}
                disabled={selected.size === 0}
                className="rounded-full bg-admin-primary-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-admin-primary dark:text-black"
              >
                {mode === "multiple" && selected.size > 1 ? `Use ${selected.size} images` : "Use image"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
