"use client";

import { useState } from "react";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/api/client";
import { IconChevronLeft, IconChevronRight } from "../ui/icons";
import type { PublicProductImage } from "@/lib/api/publicProducts";

// Real product gallery: primary image (medium variant, right-sized for the
// detail page — spec's "use the right Media variant per context") plus a
// thumbnail strip, prev/next controls, and full keyboard support (arrow
// keys move the active image while the gallery has focus; each thumbnail
// is its own focusable, labeled button).
export default function ProductGallery({
  images,
  productName,
}: {
  images: PublicProductImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-cream text-sm font-semibold text-ink-faint">
        No image available
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  function goTo(index: number) {
    setActive(((index % images.length) + images.length) % images.length);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active - 1);
    }
  }

  return (
    <div>
      <div
        role="group"
        aria-label={`${productName} image ${active + 1} of ${images.length}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative aspect-square overflow-hidden rounded-3xl bg-cream focus:outline-2 focus:outline-offset-2 focus:outline-brand"
      >
        <Image
          src={resolveMediaUrl(current.mediumUrl ?? current.url)}
          alt={current.altText || productName}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => goTo(active - 1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => goTo(active + 1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.mediaId}
              type="button"
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-pressed={active === i}
              onClick={() => goTo(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-cream transition-colors sm:h-24 sm:w-24 ${
                active === i ? "border-brand" : "border-transparent hover:border-border"
              }`}
            >
              <Image
                src={resolveMediaUrl(image.thumbnailUrl ?? image.url)}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
