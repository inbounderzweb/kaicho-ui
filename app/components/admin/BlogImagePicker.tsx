"use client";

import { useRef, useState } from "react";
import { resolveMediaUrl } from "@/lib/api/client";
import { useUploadMedia } from "@/lib/hooks/admin/useUploadMedia";
import { useUploadPhase } from "@/lib/hooks/admin/useUploadPhase";
import { updateMedia } from "@/lib/api/media";
import { IconUploadCloud, IconClose } from "../ui/icons";
import MediaLibraryModal from "./media/MediaLibraryModal";
import MediaSourceMenu from "./media/MediaSourceMenu";
import UploadProgress from "./media/UploadProgress";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_MB = 8;

export interface PickedBlogImage {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
  altText: string;
}

// Wraps the same upload flow as CategoryImagePicker but adds the alt-text
// field the blog SEO checklist and public renderer both depend on. Alt text is
// persisted onto the Media doc itself (PATCH /admin/media/:id) so it travels
// with the image everywhere it's used.
export default function BlogImagePicker({
  label,
  recommended,
  value,
  onChange,
}: {
  label: string;
  recommended: string;
  value: PickedBlogImage | null;
  onChange: (image: PickedBlogImage | null) => void;
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
      upload.failWith(`Image exceeds the ${MAX_IMAGE_MB}MB limit.`);
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
          onChange({
            mediaId: uploaded.mediaId,
            url: uploaded.url,
            thumbnailUrl: uploaded.thumbnailUrl,
            altText: "",
          });
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

  const persistAlt = (altText: string) => {
    if (!value) return;
    onChange({ ...value, altText });
    updateMedia(value.mediaId, { altText }).catch(() => {
      // Non-fatal: the value is still in the form and re-saved on submit.
    });
  };

  const previewUrl = value?.thumbnailUrl ?? value?.url;

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">{label}</p>
      <p className="mb-2 text-[11px] text-black/45 dark:text-white/45">
        Recommended: <span className="font-semibold">{recommended}</span> · max {MAX_IMAGE_MB}MB
      </p>

      {previewUrl ? (
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-admin-border dark:border-admin-border-dark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(previewUrl)} alt={value?.altText || "Preview"} className="h-full w-full object-cover" />
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
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
              Alt text (describes the image for screen readers &amp; search)
            </label>
            <input
              defaultValue={value?.altText ?? ""}
              onBlur={(e) => persistAlt(e.target.value.trim())}
              placeholder="e.g. A bowl of cooked navadhanya kanji"
              className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
            />
            {!value?.altText && (
              <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Add alt text before publishing.
              </p>
            )}
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
              <span className="text-xs font-semibold">{upload.isBusy ? "Uploading…" : "Upload image"}</span>
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
          if (p) {
            onChange({
              mediaId: p.mediaId,
              url: p.url,
              thumbnailUrl: p.thumbnailUrl,
              altText: p.altText ?? "",
            });
          }
        }}
      />
    </div>
  );
}
