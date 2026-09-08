"use client";

import { useEffect, useRef } from "react";
import type { YouTubeVideo } from "@/lib/api/youtubeVideo";
import YouTubeEmbed from "./YouTubeEmbed";
import { IconClose } from "../ui/icons";

// Small popup that renders the YouTube player for one video — the same
// browser-only /embed/ preview used on the detail form. Mirrors
// ConfirmDialog's modal mechanics (backdrop click, Escape, scroll lock).
export default function YouTubeVideoPreviewModal({
  open,
  video,
  onClose,
}: {
  open: boolean;
  video: Pick<YouTubeVideo, "url" | "videoId" | "videoType"> | null;
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

  if (!open || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of YouTube ${video.videoType === "SHORT" ? "short" : "video"} ${video.videoId}`}
        tabIndex={-1}
        className="relative w-full max-w-[460px] rounded-2xl border border-admin-border bg-admin-card p-4 shadow-xl dark:border-admin-border-dark dark:bg-admin-card-dark"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-bold">
            {video.videoType === "SHORT" ? "Short" : "Video"}{" "}
            <span className="font-mono text-black/55 dark:text-white/55">{video.videoId}</span>
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
          <YouTubeEmbed key={video.videoId} videoId={video.videoId} />
        </div>

        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block truncate text-center text-xs text-admin-primary-dark hover:underline dark:text-admin-primary"
        >
          Open on YouTube
        </a>
      </div>
    </div>
  );
}
