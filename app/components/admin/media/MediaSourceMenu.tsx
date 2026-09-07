"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconChevronDown, IconUploadCloud, IconImages } from "../../ui/icons";

// The small "Upload New | Choose from Library" chooser that replaces the bare
// file-input trigger in every image picker. It renders whatever trigger the
// caller passes (a dashed dropzone when empty, a little "Replace" pill when
// filled — each picker keeps its own look) and pops a two-item menu.

export default function MediaSourceMenu({
  trigger,
  disabled = false,
  align = "start",
  className,
  onUploadNew,
  onChooseFromLibrary,
}: {
  trigger: (props: { onClick: () => void; disabled: boolean }) => ReactNode;
  disabled?: boolean;
  align?: "start" | "end";
  /** Layout override for the positioning wrapper. Defaults to "inline-block"
   *  (its historical value); pass e.g. "block w-full" to let the trigger fill
   *  a flex row. */
  className?: string;
  onUploadNew: () => void;
  onChooseFromLibrary: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className={`relative ${className ?? "inline-block"}`}>
      {trigger({ onClick: () => !disabled && setOpen((v) => !v), disabled })}
      {open && (
        <div
          className={`absolute z-30 mt-1 w-52 overflow-hidden rounded-xl border border-admin-border bg-admin-card p-1 shadow-lg dark:border-admin-border-dark dark:bg-admin-card-dark ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          <button
            type="button"
            onClick={() => choose(onUploadNew)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-admin-primary/15 dark:hover:bg-admin-primary/10"
          >
            <IconUploadCloud className="h-4 w-4 shrink-0 text-black/50 dark:text-white/50" />
            Upload New
          </button>
          <button
            type="button"
            onClick={() => choose(onChooseFromLibrary)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-admin-primary/15 dark:hover:bg-admin-primary/10"
          >
            <IconImages className="h-4 w-4 shrink-0 text-black/50 dark:text-white/50" />
            Choose from Library
          </button>
        </div>
      )}
    </div>
  );
}

export { IconChevronDown };
