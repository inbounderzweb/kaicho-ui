"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { PopupConfig, CloseButtonSize, CloseButtonStyle, PopupDevice } from "@/lib/api/popup";
import type { DismissAttempt } from "@/lib/popup/controller";
import type { ResolvedPopupRuntime } from "@/lib/popup/timing";
import { resolveMediaUrl } from "@/lib/api/client";
import { countdownParts } from "@/lib/popup/countdown";
import { IconClose } from "../ui/icons";

// Presentational + accessibility layer. It owns NO timers that affect
// lifecycle: when to open/close is the controller's call; this only renders
// the dialog, wires keyboard/pointer events to onDismiss(), manages focus and
// ticks a display-only countdown.

const CLOSE_PX: Record<CloseButtonSize, string> = {
  // All ≥ 40px so the target stays comfortable on touch screens.
  SM: "h-10 w-10",
  MD: "h-11 w-11",
  LG: "h-14 w-14",
};
const CLOSE_ICON: Record<CloseButtonSize, string> = { SM: "h-4 w-4", MD: "h-5 w-5", LG: "h-6 w-6" };

function closeStyle(style: CloseButtonStyle, dark: boolean): string {
  if (style === "OUTLINED") {
    return dark ? "border-2 border-white/80 bg-transparent text-white" : "border-2 border-ink/70 bg-white/80 text-ink";
  }
  if (style === "SUBTLE") return dark ? "bg-white/10 text-white" : "bg-ink/5 text-ink";
  return dark ? "bg-white text-ink shadow" : "bg-ink text-white shadow";
}

const THEME = {
  LIGHT: { panel: "bg-white text-ink", muted: "text-ink-muted", cta: "bg-brand text-white hover:bg-brand-dark", dark: false },
  DARK: { panel: "bg-charcoal text-white", muted: "text-white/75", cta: "bg-white text-ink hover:bg-cream", dark: true },
  BRAND: { panel: "bg-brand text-white", muted: "text-white/85", cta: "bg-white text-brand-darker hover:bg-cream", dark: true },
} as const;

const WIDTH = { SM: "max-w-xs", MD: "max-w-md", LG: "max-w-xl" } as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface PopupViewProps {
  popup: Pick<PopupConfig, "content" | "design" | "devices"> & Partial<Pick<PopupConfig, "countdown">>;
  runtime: ResolvedPopupRuntime;
  device: PopupDevice;
  /** ms epoch the popup closes by itself, or null. Drives the countdown. */
  closesAt: number | null;
  dismissLocked: boolean;
  onDismiss: (via: DismissAttempt) => void;
  onCtaClick?: () => void;
  /**
   * Render inside the nearest positioned ancestor instead of the viewport —
   * used by the admin preview frames. Keyboard handling is then scoped to the
   * frame so the admin's own page keeps working.
   */
  contained?: boolean;
}

function useSecondsLeft(closesAt: number | null, enabled: boolean): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled || closesAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [enabled, closesAt]);
  if (!enabled || closesAt === null) return null;
  return Math.max(0, Math.ceil((closesAt - now) / 1000));
}

const DEFAULT_COUNTDOWN_LABEL = "⚡ Limited time offer. Sales ends in";

// Flip-clock style: each digit sits in its own box, the two digits of a unit
// are joined, with the unit name underneath. Blue normally; red + pulsing in
// the final hour.
function OfferCountdown({ endsAt, label }: { endsAt: string; label?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const parts = countdownParts(endsAt, now);
  if (!parts) return null; // deadline passed — never show a dead timer

  const units: [string, number][] = [
    ["Days", parts.days],
    ["Hours", parts.hours],
    ["Minutes", parts.minutes],
    ["Seconds", parts.seconds],
  ];
  const box = parts.urgent ? "bg-red-600" : "bg-brand";
  const headline = label?.trim() || DEFAULT_COUNTDOWN_LABEL;
  const spoken = `${parts.days ? `${parts.days} days ` : ""}${parts.hours} hours ${parts.minutes} minutes`;

  return (
    <div className="mt-5 text-center">
      <p className={`text-base font-bold leading-snug ${parts.urgent ? "text-red-600" : ""}`}>{headline}</p>
      {/* Digits tick every second, so they're hidden from screen readers; a
          calm static summary is announced instead. */}
      <span className="sr-only">Offer ends in about {spoken}</span>
      <div aria-hidden="true" className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-2">
        {units.map(([unit, value]) => (
          <div key={unit} className="flex flex-col items-center">
            <div className={`flex gap-px ${parts.urgent ? "motion-safe:animate-pulse" : ""}`}>
              {String(value).padStart(2, "0").split("").map((d, i) => (
                <span
                  key={i}
                  className={`flex h-11 w-8 items-center justify-center text-2xl font-extrabold tabular-nums text-white first:rounded-l-md last:rounded-r-md ${box}`}
                >
                  {d}
                </span>
              ))}
            </div>
            <span className="mt-1 text-[11px] opacity-80">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PopupView({
  popup,
  runtime,
  device,
  closesAt,
  dismissLocked,
  onDismiss,
  onCtaClick,
  contained = false,
}: PopupViewProps) {
  const { content } = popup;
  const theme = THEME[popup.design.theme];
  const placement = popup.devices[device].placement;
  // Only a centred card / mobile sheet dims the page and traps focus. A
  // corner toast leaves the rest of the page fully usable.
  const modal = placement === "CENTER" || placement === "BOTTOM_SHEET";

  const titleId = useId();
  const bodyId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const secondsLeft = useSecondsLeft(closesAt, runtime.countdownVisible);

  // Focus: move into a modal on open, restore on close. Non-modals never
  // steal focus.
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    (closeRef.current ?? dialogRef.current)?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, [modal]);

  // Escape. Real popup: document-level. Contained preview: only when focus
  // is inside the frame (handled by onKeyDown below).
  useEffect(() => {
    if (contained) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss("escape");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [contained, onDismiss]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (contained && e.key === "Escape") {
      onDismiss("escape");
      return;
    }
    if (e.key !== "Tab" || !modal || !dialogRef.current) return;
    const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) {
      e.preventDefault();
      dialogRef.current.focus();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const position = contained ? "absolute" : "fixed";
  const wrapperPlacement =
    placement === "BOTTOM_SHEET"
      ? "items-end justify-center"
      : placement === "BOTTOM_RIGHT"
        ? "items-end justify-end p-4"
        : placement === "BOTTOM_LEFT"
          ? "items-end justify-start p-4"
          : "items-center justify-center p-4";

  const closeSide = runtime.closeButtonPosition === "TOP_LEFT" ? "left-2" : "right-2";
  const countdownOn = Boolean(popup.countdown?.enabled && popup.countdown.endsAt);
  const waitLabel = secondsLeft !== null ? `${secondsLeft}s` : "";
  const sheet = placement === "BOTTOM_SHEET";

  const cta =
    content.ctaLabel && content.ctaUrl ? (
      content.ctaUrl.startsWith("/") ? (
        <Link
          href={content.ctaUrl as never}
          onClick={onCtaClick}
          className={`mt-5 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors ${theme.cta}`}
        >
          {content.ctaLabel}
        </Link>
      ) : (
        <a
          href={content.ctaUrl}
          onClick={onCtaClick}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-5 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors ${theme.cta}`}
        >
          {content.ctaLabel}
        </a>
      )
    ) : null;

  return (
    <div
      ref={rootRef}
      data-popup-root
      className={`${position} inset-0 z-[70] flex ${wrapperPlacement} ${modal ? "bg-black/50" : "pointer-events-none"}`}
      onMouseDown={(e) => {
        // Backdrop = a press on the dim layer itself, never on the card.
        if (modal && e.target === e.currentTarget) onDismiss("backdrop");
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal={modal ? "true" : undefined}
        aria-labelledby={content.heading ? titleId : undefined}
        aria-label={content.heading ? undefined : "Promotion"}
        aria-describedby={content.body ? bodyId : undefined}
        tabIndex={-1}
        className={`pointer-events-auto relative w-full overflow-hidden shadow-2xl outline-none ${WIDTH[popup.design.size]} ${theme.panel} ${
          sheet ? "rounded-t-3xl pb-[env(safe-area-inset-bottom)]" : "rounded-3xl"
        } max-h-[90%] overflow-y-auto`}
      >
        {runtime.closeButtonEnabled && (
          <button
            ref={closeRef}
            type="button"
            aria-label={dismissLocked ? `Close popup (available in ${waitLabel || "a moment"})` : "Close popup"}
            aria-disabled={dismissLocked || undefined}
            onClick={() => onDismiss("manual")}
            className={`absolute top-2 ${closeSide} z-10 inline-flex items-center justify-center rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${CLOSE_PX[runtime.closeButtonSize]} ${closeStyle(runtime.closeButtonStyle, theme.dark)} ${
              dismissLocked ? "opacity-50" : "hover:opacity-90"
            }`}
          >
            <IconClose className={CLOSE_ICON[runtime.closeButtonSize]} aria-hidden="true" />
          </button>
        )}

        {content.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(content.imageUrl)}
            alt={content.imageAlt ?? ""}
            className="aspect-[16/9] w-full object-cover"
          />
        )}

        <div className={`p-6 pt-8 ${countdownOn ? "text-center" : ""}`}>
          {content.heading && (
            <h2 id={titleId} className={`text-xl font-bold leading-snug ${countdownOn ? "" : "pr-8"}`}>
              {content.heading}
            </h2>
          )}
          {content.body && (
            <p id={bodyId} className={`mt-2 text-sm leading-6 ${theme.muted}`}>
              {content.body}
            </p>
          )}
          {popup.countdown?.enabled && popup.countdown.endsAt && (
            <OfferCountdown endsAt={popup.countdown.endsAt} label={popup.countdown.label} />
          )}
          {cta}

          <div className="mt-4 flex items-center justify-between gap-3">
            {/* The reliable fallback: when the × is hidden, a plain text
                control is always present, so no configuration can leave a
                visitor without an accessible way out. */}
            {!runtime.closeButtonEnabled ? (
              <button
                ref={closeRef}
                type="button"
                aria-disabled={dismissLocked || undefined}
                onClick={() => onDismiss("manual")}
                className={`min-h-11 rounded-md px-1 text-sm font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${theme.muted} ${
                  dismissLocked ? "opacity-60" : ""
                }`}
              >
                {dismissLocked && waitLabel ? `No thanks (${waitLabel})` : "No thanks"}
              </button>
            ) : (
              <span />
            )}
            {runtime.countdownVisible && secondsLeft !== null && (
              <p role="timer" aria-live="off" className={`text-xs tabular-nums ${theme.muted}`}>
                Closing in {secondsLeft}s
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
