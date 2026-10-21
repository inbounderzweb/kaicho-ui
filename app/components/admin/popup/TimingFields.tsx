"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { PopupFormValues } from "@/lib/validation/popup.schema";
import { POPUP_LIMITS as L } from "@/lib/popup/limits";
import { NumberField, ToggleField, SelectField, HINT } from "./fields";

export type TimingBase = "timing.shared" | "timing.desktop" | "timing.mobile";

/** Initial delay, auto-close, countdown — when the popup opens and closes. */
export function OpenCloseTimingFields({ base, disabled }: { base: TimingBase; disabled?: boolean }) {
  const { control } = useFormContext<PopupFormValues>();
  const autoClose = useWatch({ control, name: `${base}.autoCloseEnabled` as "timing.shared.autoCloseEnabled" });
  const allowEarly = useWatch({ control, name: "display.allowEarlyDismiss" });
  return (
    <div className="space-y-4">
      <NumberField
        name={`${base}.initialDelaySeconds`}
        label="Initial delay"
        disabled={disabled}
        hint={`Seconds after page load before the popup appears (${L.initialDelaySeconds.min}–${L.initialDelaySeconds.max}).`}
      />
      <ToggleField
        name={`${base}.autoCloseEnabled`}
        label="Enable auto-close"
        disabled={disabled || !allowEarly}
        hint={
          allowEarly
            ? "Close the popup automatically after it has been open for the time below."
            : "Required while early dismissal is turned off."
        }
      />
      <NumberField
        name={`${base}.autoCloseAfterSeconds`}
        label="Auto-close timer"
        disabled={disabled || (!autoClose && allowEarly)}
        hint={`Seconds the popup stays open before closing itself (${L.autoCloseAfterSeconds.min}–${L.autoCloseAfterSeconds.max}). Counted from when it opens — separate from the initial delay.`}
      />
      <ToggleField
        name={`${base}.countdownVisible`}
        label="Show countdown inside the popup"
        disabled={disabled}
        hint="Works with or without auto-close. Without auto-close it counts down to the maximum display time."
      />
    </div>
  );
}

/** Close button visibility/position, backdrop and Escape dismissal. */
export function CloseControlFields({ base, disabled }: { base: TimingBase; disabled?: boolean }) {
  const { control } = useFormContext<PopupFormValues>();
  const closeOn = useWatch({ control, name: `${base}.closeButtonEnabled` as "timing.shared.closeButtonEnabled" });
  return (
    <div className="space-y-4">
      <ToggleField name={`${base}.closeButtonEnabled`} label="Show the close (×) button" disabled={disabled} />
      {!closeOn && (
        <p className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          With the × hidden, a plain “No thanks” link is shown instead so visitors always have an accessible way out.
        </p>
      )}
      <SelectField
        name={`${base}.closeButtonPosition`}
        label="Close button position"
        disabled={disabled || !closeOn}
        options={[
          { value: "TOP_RIGHT", label: "Top right" },
          { value: "TOP_LEFT", label: "Top left" },
        ]}
      />
      <ToggleField name={`${base}.backdropDismissEnabled`} label="Close when clicking the backdrop" disabled={disabled} />
      <ToggleField name={`${base}.escapeDismissEnabled`} label="Close with the Escape key" disabled={disabled} />
    </div>
  );
}

export function PerDeviceNote() {
  return (
    <p className={`${HINT} rounded-xl bg-black/5 p-3 dark:bg-white/5`}>
      Shared timing is turned on, so this device uses the shared values. Turn off “Use shared timing settings” in
      Triggers &amp; Display Timing to edit it separately.
    </p>
  );
}
