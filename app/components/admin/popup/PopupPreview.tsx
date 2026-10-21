"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PopupDevice } from "@/lib/api/popup";
import { PopupController, createMemoryStore, type CloseReason, type DismissAttempt } from "@/lib/popup/controller";
import { describeVisibleDuration, type ResolvedPopupRuntime } from "@/lib/popup/timing";
import { runtimeFromForm } from "@/lib/popup/form";
import type { PopupFormValues } from "@/lib/validation/popup.schema";
import PopupView from "../../popup/PopupView";

// Admin-only sandbox for the real popup runtime.
//
// SAFETY: this file deliberately imports nothing that talks to the backend —
// no sendPopupEvent, no mutations, no React Query. It uses an in-memory
// store, so a preview can't publish anything, count an impression, or touch
// the storefront's session/suppression state in this browser.

export interface PopupPreviewHandle {
  play: () => void;
}

type Phase =
  | { kind: "idle" }
  | { kind: "static" }
  | { kind: "waiting"; opensAt: number }
  | { kind: "open"; closesAt: number }
  | { kind: "closed"; reason: CloseReason };

const REASON_LABEL: Record<CloseReason, string> = {
  manual: "closed with the × / “No thanks”",
  backdrop: "closed by clicking the backdrop",
  escape: "closed with Escape",
  auto: "auto-closed by the timer",
  "max-duration": "closed by the maximum display time",
  route: "closed on navigation",
};

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

const PopupPreview = forwardRef<PopupPreviewHandle, { values: PopupFormValues; device: PopupDevice; onDeviceChange: (d: PopupDevice) => void }>(
  function PopupPreview({ values, device, onDeviceChange }, ref) {
    const [phase, setPhase] = useState<Phase>({ kind: "idle" });
    const [session, setSession] = useState<{ runtime: ResolvedPopupRuntime; popup: ReturnType<typeof runtimeFromForm>["popup"] } | null>(null);
    const controllerRef = useRef<PopupController | null>(null);
    const now = useNow(phase.kind === "waiting" || phase.kind === "open");

    const stop = useCallback(() => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    }, []);

    useEffect(() => stop, [stop]);

    const play = useCallback(() => {
      stop();
      const { popup, runtime } = runtimeFromForm(values, device);
      if (!runtime) {
        setSession(null);
        setPhase({ kind: "idle" });
        return;
      }
      // One clean cycle: the preview shows delay → open → close, not repeats.
      const rt: ResolvedPopupRuntime = { ...runtime, sessionDisplayLimit: 1, repeatIntervalMs: 0 };
      setSession({ runtime: rt, popup });
      const controller = new PopupController(rt, {
        store: createMemoryStore(),
        onOpen: ({ closesAt }) => setPhase({ kind: "open", closesAt }),
        onClose: (reason) => setPhase({ kind: "closed", reason }),
      });
      controllerRef.current = controller;
      setPhase({ kind: "waiting", opensAt: Date.now() + rt.initialDelayMs });
      controller.start(true);
    }, [values, device, stop]);

    const showStatic = useCallback(() => {
      stop();
      const { popup, runtime } = runtimeFromForm(values, device);
      if (!runtime) return;
      setSession({ runtime, popup });
      setPhase({ kind: "static" });
    }, [values, device, stop]);

    useImperativeHandle(ref, () => ({ play }), [play]);

    const onDismiss = useCallback(
      (via: DismissAttempt) => {
        if (phase.kind === "static") {
          setPhase({ kind: "idle" });
          return;
        }
        controllerRef.current?.dismiss(via);
      },
      [phase.kind]
    );

    const { runtime: liveRuntime } = runtimeFromForm(values, device);
    const duration = liveRuntime ? describeVisibleDuration(liveRuntime) : null;
    const visible = (phase.kind === "open" || phase.kind === "static") && session;

    let status = "Press “Play timeline” to see the real delay, countdown and auto-close.";
    if (!liveRuntime) status = `The popup is switched off for ${device}.`;
    else if (phase.kind === "waiting") status = `Waiting for the initial delay… opens in ${Math.max(0, Math.ceil((phase.opensAt - now) / 1000))}s`;
    else if (phase.kind === "open") status = `Open — ${Math.max(0, Math.ceil((phase.closesAt - now) / 1000))}s until it closes by itself`;
    else if (phase.kind === "closed") status = `Closed — ${REASON_LABEL[phase.reason]}.`;
    else if (phase.kind === "static") status = "Design preview (timers off). Close it to dismiss.";

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div role="group" aria-label="Preview device" className="inline-flex rounded-full border border-admin-border p-0.5 dark:border-admin-border-dark">
            {(["desktop", "mobile"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => {
                  stop();
                  setPhase({ kind: "idle" });
                  onDeviceChange(d);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  device === d ? "bg-admin-primary text-black" : "text-black/60 dark:text-white/60"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={showStatic} className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold dark:border-admin-border-dark">
              Design only
            </button>
            <button type="button" onClick={play} className="rounded-full bg-admin-primary px-3 py-1 text-xs font-semibold text-black hover:opacity-90">
              ▶ Play timeline
            </button>
          </div>
        </div>

        <div
          data-testid="popup-preview-frame"
          className={`relative isolate mx-auto overflow-hidden rounded-2xl border border-admin-border bg-gradient-to-b from-black/5 to-black/10 dark:border-admin-border-dark dark:from-white/5 dark:to-white/10 ${
            device === "mobile" ? "h-[480px] w-[260px]" : "h-[360px] w-full"
          }`}
        >
          {/* Faux storefront behind the popup */}
          <div aria-hidden="true" className="space-y-3 p-4">
            <div className="h-3 w-1/3 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-20 rounded-xl bg-black/10 dark:bg-white/10" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-16 rounded-lg bg-black/10 dark:bg-white/10" />
              <div className="h-16 rounded-lg bg-black/10 dark:bg-white/10" />
              <div className="h-16 rounded-lg bg-black/10 dark:bg-white/10" />
            </div>
          </div>
          {visible && (
            <PopupView
              contained
              popup={session.popup}
              runtime={session.runtime}
              device={device}
              closesAt={phase.kind === "open" ? phase.closesAt : null}
              dismissLocked={phase.kind === "open" && !session.runtime.allowEarlyDismiss}
              onDismiss={onDismiss}
            />
          )}
        </div>

        <p role="status" className="text-xs font-semibold text-black/70 dark:text-white/70">
          {status}
        </p>
        {duration && (
          <p className="text-xs text-black/50 dark:text-white/50">
            Visible for{" "}
            <strong>
              {duration.cappedByMax ? "up to " : ""}
              {duration.seconds}s
            </strong>{" "}
            once open ({duration.viaAutoClose ? "auto-close" : "maximum display time"}).
          </p>
        )}
        <p className="text-[11px] text-black/40 dark:text-white/40">
          Preview only — runs in this tab, saves nothing and records no analytics. Uses your unsaved edits.
        </p>
      </div>
    );
  }
);

export default PopupPreview;
