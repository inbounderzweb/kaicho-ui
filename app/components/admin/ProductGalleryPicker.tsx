"use client";

import { useRef, useState } from "react";
import { resolveMediaUrl } from "@/lib/api/client";
import { useUploadMedia } from "@/lib/hooks/admin/useUploadMedia";
import { IconUploadCloud, IconTrash, IconStar } from "../ui/icons";
import MediaLibraryModal from "./media/MediaLibraryModal";
import MediaSourceMenu from "./media/MediaSourceMenu";

// Product images are NOT stored as binaries or extra URL fields on Product —
// this picker only ever writes/reads Media records via the existing Media
// module (useUploadMedia -> POST /admin/media/upload). What the picker holds
// is an ORDERED array of mediaIds; the backend (product.service.ts's
// syncProductMedia) treats array index 0 as the primary image and the rest
// of the order as gallery sortOrder — so "set primary" here is implemented
// as "move to index 0" rather than a separate flag, matching that contract.
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_MB = 1.5;
const MAX_IMAGES = 20;
const RECOMMENDED_DIMENSIONS = "1000 × 1000px";

export interface PickedGalleryImage {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
}

export default function ProductGalleryPicker({
  value,
  onChange,
}: {
  value: PickedGalleryImage[];
  onChange: (images: PickedGalleryImage[]) => void;
}) {
  const uploadMutation = useUploadMedia();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  // When set, the library modal is replacing this single tile instead of adding.
  const [replaceViaLibrary, setReplaceViaLibrary] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  const remainingSlots = MAX_IMAGES - value.length;

  const appendFromLibrary = (picks: { mediaId: string; url: string; thumbnailUrl?: string }[]) => {
    setError(null);
    const next = picks
      .filter((p) => !value.some((v) => v.mediaId === p.mediaId))
      .slice(0, remainingSlots)
      .map((p) => ({ mediaId: p.mediaId, url: p.url, thumbnailUrl: p.thumbnailUrl }));
    if (next.length > 0) onChange([...value, ...next]);
  };

  const replaceFromLibrary = (index: number, pick: { mediaId: string; url: string; thumbnailUrl?: string }) => {
    const next = [...value];
    next[index] = { mediaId: pick.mediaId, url: pick.url, thumbnailUrl: pick.thumbnailUrl };
    onChange(next);
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= value.length || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const validateFiles = (files: File[]): { valid: File[]; rejected: string[] } => {
    const valid: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        rejected.push(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        rejected.push(`${file.name}: exceeds ${MAX_IMAGE_MB}MB limit`);
        continue;
      }
      valid.push(file);
    }
    return { valid, rejected };
  };

  const handleAddFiles = (files: File[]) => {
    setError(null);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - value.length;
    if (remainingSlots <= 0) {
      setError(`You can add up to ${MAX_IMAGES} images per product.`);
      return;
    }

    const { valid, rejected } = validateFiles(files.slice(0, remainingSlots));
    const droppedForLimit = files.length > remainingSlots ? files.length - remainingSlots : 0;

    if (valid.length === 0) {
      setError(rejected[0] ?? "No valid images selected.");
      return;
    }

    setProgress(0);
    uploadMutation.mutate(
      { files: valid, onProgress: setProgress },
      {
        onSuccess: (result) => {
          const uploaded = result.data.map((item) => ({
            mediaId: item.mediaId,
            url: item.url,
            thumbnailUrl: item.thumbnailUrl,
          }));
          if (uploaded.length > 0) {
            onChange([...value, ...uploaded]);
          }
          const messages = [
            ...rejected,
            ...result.errors.map((e) => `${e.originalName}: ${e.message}`),
            ...(droppedForLimit > 0 ? [`${droppedForLimit} file(s) skipped — ${MAX_IMAGES} image limit reached.`] : []),
          ];
          if (messages.length > 0) setError(messages.join("; "));
        },
        onError: () => setError("Upload failed. Please try again."),
      }
    );
  };

  const handleReplaceFile = (file: File) => {
    const index = replaceIndexRef.current;
    if (index === null) return;
    setError(null);

    const { valid, rejected } = validateFiles([file]);
    if (valid.length === 0) {
      setError(rejected[0] ?? "Unsupported file.");
      return;
    }

    setProgress(0);
    uploadMutation.mutate(
      { files: valid, onProgress: setProgress },
      {
        onSuccess: (result) => {
          const uploaded = result.data[0];
          if (!uploaded) {
            setError(result.errors[0]?.message ?? "Upload failed. Please try again.");
            return;
          }
          const next = [...value];
          next[index] = { mediaId: uploaded.mediaId, url: uploaded.url, thumbnailUrl: uploaded.thumbnailUrl };
          onChange(next);
        },
        onError: () => setError("Upload failed. Please try again."),
      }
    );
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const isBusy = uploadMutation.isPending;

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-black/60 dark:text-white/60">Product Images</p>
      <p className="mb-3 text-[11px] text-black/45 dark:text-white/45">
        Recommended size: <span className="font-semibold">{RECOMMENDED_DIMENSIONS}</span> — max {MAX_IMAGE_MB}MB each,
        up to {MAX_IMAGES} images. The first image is the primary image shown in listings.
      </p>

      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((image, index) => (
            <div
              key={image.mediaId}
              draggable={!isBusy}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) reorder(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`group relative cursor-grab overflow-hidden rounded-xl border border-admin-border active:cursor-grabbing dark:border-admin-border-dark ${
                dragIndex === index ? "opacity-40" : ""
              }`}
            >
              <div className="aspect-square w-full overflow-hidden bg-black/5 dark:bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(image.thumbnailUrl ?? image.url)}
                  alt={`Product image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>

              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-admin-primary-dark px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  <IconStar className="h-3 w-3" />
                  Primary
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-black/55 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={isBusy || index === 0}
                    title="Move earlier"
                    aria-label="Move earlier"
                    className="shrink-0 rounded bg-white/90 px-1.5 py-1 text-[11px] font-bold leading-none text-black disabled:opacity-30"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={isBusy || index === value.length - 1}
                    title="Move later"
                    aria-label="Move later"
                    className="shrink-0 rounded bg-white/90 px-1.5 py-1 text-[11px] font-bold leading-none text-black disabled:opacity-30"
                  >
                    ▶
                  </button>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => setPrimary(index)}
                      disabled={isBusy}
                      title="Set as primary"
                      aria-label="Set as primary"
                      className="shrink-0 inline-flex items-center rounded bg-white/90 px-1.5 py-1 text-black disabled:opacity-30"
                    >
                      <IconStar className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={isBusy}
                    title="Remove"
                    aria-label="Remove image"
                    className="ml-auto shrink-0 inline-flex items-center rounded bg-white/90 px-1.5 py-1 text-black disabled:opacity-30"
                  >
                    <IconTrash className="h-3 w-3" />
                  </button>
                </div>
                <MediaSourceMenu
                  className="block w-full"
                  disabled={isBusy}
                  onUploadNew={() => {
                    replaceIndexRef.current = index;
                    replaceInputRef.current?.click();
                  }}
                  onChooseFromLibrary={() => setReplaceViaLibrary(index)}
                  trigger={({ onClick, disabled }) => (
                    <button
                      type="button"
                      onClick={onClick}
                      disabled={disabled}
                      className="w-full whitespace-nowrap rounded bg-white/90 px-1.5 py-1 text-[10px] font-semibold text-black disabled:opacity-30"
                    >
                      Replace
                    </button>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length < MAX_IMAGES && (
        <MediaSourceMenu
          disabled={isBusy}
          onUploadNew={() => addInputRef.current?.click()}
          onChooseFromLibrary={() => setLibraryOpen(true)}
          trigger={({ onClick, disabled }) => (
            <button
              type="button"
              onClick={onClick}
              disabled={disabled}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-admin-border p-6 text-center transition-colors hover:border-admin-primary-dark disabled:opacity-50 dark:border-admin-border-dark dark:hover:border-admin-primary"
            >
              <IconUploadCloud className="h-6 w-6 text-black/40 dark:text-white/40" />
              <span className="text-xs font-semibold">{isBusy ? `Uploading… ${progress}%` : "Add Images"}</span>
              <span className="text-[11px] text-black/45 dark:text-white/45">
                JPG, PNG, WebP, or AVIF — select multiple, or drag tiles to reorder
              </span>
            </button>
          )}
        />
      )}

      {isBusy && value.length > 0 && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full bg-admin-primary-dark transition-all dark:bg-admin-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
      {value.length === 0 && !error && (
        <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
          At least one primary image is required before this product can be published.
        </p>
      )}

      <input
        ref={addInputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) handleAddFiles(files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReplaceFile(file);
          e.target.value = "";
        }}
      />

      {/* Add from library (multi-select, capped at the remaining slots). */}
      <MediaLibraryModal
        open={libraryOpen}
        mode="multiple"
        maxSelection={remainingSlots}
        onClose={() => setLibraryOpen(false)}
        onConfirm={(picks) => appendFromLibrary(picks)}
      />

      {/* Replace one tile from the library. */}
      <MediaLibraryModal
        open={replaceViaLibrary !== null}
        mode="single"
        onClose={() => setReplaceViaLibrary(null)}
        onConfirm={(picks) => {
          if (replaceViaLibrary !== null && picks[0]) replaceFromLibrary(replaceViaLibrary, picks[0]);
        }}
      />
    </div>
  );
}
