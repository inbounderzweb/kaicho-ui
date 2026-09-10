"use client";

import { useRef, useState } from "react";
import { resolveMediaUrl } from "@/lib/api/client";
import { useUploadMedia } from "@/lib/hooks/admin/useUploadMedia";
import { useUploadPhase } from "@/lib/hooks/admin/useUploadPhase";
import { IconUploadCloud, IconClose } from "../ui/icons";
import MediaLibraryModal from "./media/MediaLibraryModal";
import MediaSourceMenu from "./media/MediaSourceMenu";
import UploadProgress from "./media/UploadProgress";

// Mirrors CategoryImagePicker / BrandLogoPicker exactly — same upload flow,
// same limits, same "Upload New | Choose from Library" chooser. Collections
// previously had an `imageMediaId` form field with no control wired to it;
// this fills that gap without changing the surrounding form.
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_MB = 1.5;
const RECOMMENDED_DIMENSIONS = "1200 × 800px";

export interface PickedImage {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
}

export default function CollectionImagePicker({
  value,
  onChange,
}: {
  value: PickedImage | null;
  onChange: (image: PickedImage | null) => void;
}) {
  const uploadMutation = useUploadMedia();
  const upload = useUploadPhase();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // The last accepted file, so "Retry" after a network failure re-sends it
  // instead of forcing the admin to locate it again.
  const lastFileRef = useRef<File | null>(null);

  const handleFile = (file: File) => {
    if (upload.isBusy) return; // guard against a double upload
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      lastFileRef.current = null;
      upload.failWith("Unsupported file type — use JPG, PNG, WebP, or AVIF.");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      lastFileRef.current = null;
      upload.failWith(
        `Image exceeds the ${MAX_IMAGE_MB}MB limit — try resizing it to around ${RECOMMENDED_DIMENSIONS} first.`
      );
      return;
    }

    lastFileRef.current = file;
    upload.start();
    uploadMutation.mutate(
      { files: [file], onProgress: upload.handleProgress },
      {
        onSuccess: (result) => {
          const uploaded = result.data[0];
          if (!uploaded) {
            upload.failWith(result.errors[0]?.message ?? "Upload failed. Please try again.");
            return;
          }
          upload.succeed();
          onChange({ mediaId: uploaded.mediaId, url: uploaded.url, thumbnailUrl: uploaded.thumbnailUrl });
        },
        onError: () => upload.failWith("Upload failed. Please try again."),
      }
    );
  };

  const handleRetry = () => {
    const file = lastFileRef.current;
    if (file) handleFile(file);
    else inputRef.current?.click();
  };

  const previewUrl = value?.thumbnailUrl ?? value?.url;

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-black/60 dark:text-white/60">Collection Image</p>
      <p className="mb-2 text-[11px] text-black/45 dark:text-white/45">
        Recommended size: <span className="font-semibold">{RECOMMENDED_DIMENSIONS}</span> — max {MAX_IMAGE_MB}MB
      </p>

      {previewUrl ? (
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-admin-border dark:border-admin-border-dark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveMediaUrl(previewUrl)} alt="Collection" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-2">
            <MediaSourceMenu
              disabled={upload.isBusy}
              onUploadNew={() => inputRef.current?.click()}
              onChooseFromLibrary={() => setLibraryOpen(true)}
              trigger={({ onClick, disabled }) => (
                <button
                  type="button"
                  onClick={onClick}
                  disabled={disabled}
                  className="rounded-full border border-admin-border px-3 py-1.5 text-xs font-semibold hover:bg-admin-primary/20 disabled:opacity-50 dark:border-admin-border-dark dark:hover:bg-admin-primary/10"
                >
                  Replace
                </button>
              )}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={upload.isBusy}
              className="inline-flex items-center gap-1 text-xs font-semibold text-black/55 hover:text-red-600 disabled:opacity-50 dark:text-white/55"
            >
              <IconClose className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <MediaSourceMenu
          disabled={upload.isBusy}
          onUploadNew={() => inputRef.current?.click()}
          onChooseFromLibrary={() => setLibraryOpen(true)}
          trigger={({ onClick, disabled }) => (
            <button
              type="button"
              onClick={onClick}
              disabled={disabled}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-admin-border p-6 text-center transition-colors hover:border-admin-primary-dark disabled:opacity-50 dark:border-admin-border-dark dark:hover:border-admin-primary"
            >
              <IconUploadCloud className="h-6 w-6 text-black/40 dark:text-white/40" />
              <span className="text-xs font-semibold">{upload.isBusy ? "Uploading…" : "Upload Image"}</span>
              <span className="text-[11px] text-black/45 dark:text-white/45">JPG, PNG, WebP, or AVIF</span>
            </button>
          )}
        />
      )}

      <UploadProgress
        phase={upload.phase}
        percent={upload.percent}
        error={upload.error}
        onRetry={handleRetry}
      />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <MediaLibraryModal
        open={libraryOpen}
        mode="single"
        onClose={() => setLibraryOpen(false)}
        onConfirm={(picks) => {
          const p = picks[0];
          if (p) onChange({ mediaId: p.mediaId, url: p.url, thumbnailUrl: p.thumbnailUrl });
        }}
      />
    </div>
  );
}
