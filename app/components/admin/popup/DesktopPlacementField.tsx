"use client";

import { useFormContext } from "react-hook-form";
import { DESKTOP_PLACEMENTS, type DesktopPlacement } from "@/lib/api/popup";
import type { PopupFormValues } from "@/lib/validation/popup.schema";
import { ERR, HINT, LABEL, errorAt } from "./fields";

const LABELS: Record<DesktopPlacement, string> = {
  TOP_LEFT: "Top left", TOP_CENTER: "Top center", TOP_RIGHT: "Top right",
  CENTER_LEFT: "Middle left", CENTER: "Center", CENTER_RIGHT: "Middle right",
  BOTTOM_LEFT: "Bottom left", BOTTOM_CENTER: "Bottom center", BOTTOM_RIGHT: "Bottom right",
};

export default function DesktopPlacementField() {
  const { register, formState } = useFormContext<PopupFormValues>();
  const name = "devices.desktop.placement";
  const error = errorAt(formState.errors, name);

  return (
    <fieldset>
      <legend className={LABEL}>Desktop banner position</legend>
      <div className="grid max-w-sm grid-cols-3 gap-2">
        {DESKTOP_PLACEMENTS.map((placement) => (
          <label key={placement} className="relative cursor-pointer">
            <input type="radio" value={placement} {...register(name)} className="peer sr-only" />
            <span className="flex min-h-14 items-center justify-center rounded-xl border border-admin-border p-2 text-center text-xs font-medium transition-colors peer-checked:border-admin-primary-dark peer-checked:bg-admin-primary/30 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-admin-primary-dark dark:border-admin-border-dark">
              {LABELS[placement]}
            </span>
          </label>
        ))}
      </div>
      {error && <p className={ERR}>{error}</p>}
      <p className={HINT}>Desktop only. Center dims the page; the other positions leave the page usable.</p>
    </fieldset>
  );
}
