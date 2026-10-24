"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { PopupConfig, CountdownPosition, CloseButtonSize, CloseButtonStyle, DesktopPlacement, MobilePlacement, PopupDevice } from "@/lib/api/popup";
import type { DismissAttempt } from "@/lib/popup/controller";
import type { ResolvedPopupRuntime } from "@/lib/popup/timing";
import { resolveMediaUrl } from "@/lib/api/client";
import { countdownParts } from "@/lib/popup/countdown";
import { popupImageUrl } from "@/lib/popup/media";
import { IconClose } from "../ui/icons";
import styles from "./PopupView.module.css";

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

// Where the countdown sits on a banner image (six alignment spots).
const COUNTDOWN_SPOT: Record<CountdownPosition, string> = {
  TOP_LEFT: "top-0 justify-start text-left",
  TOP_CENTER: "top-0 justify-center text-center",
  TOP_RIGHT: "top-0 justify-end text-right",
  BOTTOM_LEFT: "bottom-0 justify-start text-left",
  BOTTOM_CENTER: "bottom-0 justify-center text-center",
  BOTTOM_RIGHT: "bottom-0 justify-end text-right",
};

const WIDTH = { SM: "max-w-xl", MD: "max-w-3xl", LG: "max-w-5xl" } as const;

const PLACEMENT: Record<DesktopPlacement | MobilePlacement, string> = {
  TOP_LEFT: "items-start justify-start p-4",
  TOP_CENTER: "items-start justify-center p-4",
  TOP_RIGHT: "items-start justify-end p-4",
  CENTER_LEFT: "items-center justify-start p-4",
  CENTER: "items-center justify-center p-4",
  CENTER_RIGHT: "items-center justify-end p-4",
  BOTTOM_LEFT: "items-end justify-start p-4",
  BOTTOM_CENTER: "items-end justify-center p-4",
  BOTTOM_RIGHT: "items-end justify-end p-4",
  BOTTOM_SHEET: "items-end justify-center",
};

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

// Flip-clock style: each digit sits in its own box, the two digits of a unit
// are joined, with the unit name underneath. Brand colour normally; red +
// pulsing in the final hour. `overlay` = sits on the bottom of the image.
function OfferCountdown({ endsAt, label, overlay = false, position = "BOTTOM_CENTER" }: { endsAt: string; label?: string; overlay?: boolean; position?: CountdownPosition }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const parts = countdownParts(endsAt, now);
  if (!parts) return null; // deadline passed — never show a dead timer

  // Always days · hours · minutes · seconds (dd hh mm ss).
  const units: [string, number][] = [
    ["Days", parts.days],
    ["Hours", parts.hours],
    ["Minutes", parts.minutes],
    ["Seconds", parts.seconds],
  ];
  const box = parts.urgent ? "border-red-600 text-red-600" : "border-neutral-500/70 text-black";
  const headline = label?.trim();
  const spoken = `${parts.days ? `${parts.days} days ` : ""}${parts.hours} hours ${parts.minutes} minutes`;

  return (
    <div
      className={
        overlay
          ? `${styles.countdown} absolute inset-x-0 flex translate-y-1 p-3 text-black md:translate-y-0 ${COUNTDOWN_SPOT[position]}`
          : "mt-5 text-center"
      }
    >
      <div>
      {headline && <p className={`text-base font-bold leading-snug ${parts.urgent && !overlay ? "text-red-600" : ""}`}>{headline}</p>}
      {/* Digits tick every second, so they're hidden from screen readers; a
          calm static summary is announced instead. */}
      <span className="sr-only">Offer ends in about {spoken}</span>
      <div aria-hidden="true" className={`flex flex-nowrap justify-center gap-x-2 ${headline ? "mt-3" : ""}`}>
        {units.map(([unit, value], index) => (
          <div
            key={unit}
            className={`${overlay ? styles.countdownUnit : ""} flex flex-col items-center`}
            style={overlay ? { animationDelay: `${320 + index * 90}ms` } : undefined}
          >
            <div className={`flex gap-0.5 ${parts.urgent ? "motion-safe:animate-pulse" : ""}`}>
              {String(value).padStart(2, "0").split("").map((d, i) => (
                <span
                  key={i}
                  className={`flex items-center justify-center font-semibold tabular-nums rounded-sm border ${box} ${
                    overlay ? "h-7 w-5 text-sm md:h-10 md:w-7 md:text-lg" : "h-8 w-6 text-base"
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>
            <span className={`mt-0.5 text-[9px] md:text-[10px] ${overlay ? "opacity-90" : "opacity-80"}`}>{unit}</span>
          </div>
        ))}
      </div>
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
  // A banner whose file is gone (deleted upload, bad URL) must not leave an
  // empty, zero-height popup: once it fails to load we drop it and show the
  // text card instead, or nothing at all if there is no text.
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const deviceImage = popupImageUrl(content, device);
  const bannerImage = deviceImage && deviceImage !== failedImage ? deviceImage : undefined;
  const imageBroken = Boolean(deviceImage) && deviceImage === failedImage;
  // Image promotions are edge-to-edge: saved copy must not add a text panel.
  const imageOnly = Boolean(bannerImage);
  const theme = THEME[popup.design.theme];
  // An edge-to-edge image banner reads as a floating card, not a drawer: a
  // bottom-sheet placement (the mobile default) would pin it to the bottom
  // edge, so centre it instead.
  const configuredPlacement = popup.devices[device].placement;
  const placement = imageOnly && configuredPlacement === "BOTTOM_SHEET" ? "CENTER" : configuredPlacement;
  // Only a centred card / mobile sheet dims the page and traps focus. A
  // banner in any other desktop position leaves the page fully usable.
  const modal = placement === "CENTER" || placement === "BOTTOM_SHEET";

  const titleId = useId();
  const bodyId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const secondsLeft = useSecondsLeft(closesAt, runtime.countdownVisible);

  // Focus: move into a modal on open, restore on close. Non-modals never
  // steal focus.
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    (imageOnly ? dialogRef.current : closeRef.current ?? dialogRef.current)?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, [modal, imageOnly]);

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
  const wrapperPlacement = PLACEMENT[placement] ?? PLACEMENT.CENTER;

  const closeSide = runtime.closeButtonPosition === "TOP_LEFT" ? "left-2" : "right-2";
  const countdownOn = Boolean(popup.countdown?.enabled && popup.countdown.endsAt);
  const imageUrl = bannerImage ? resolveMediaUrl(bannerImage) : null;
  const showCloseButton = runtime.closeButtonEnabled || imageOnly;
  const closeButtonClasses = imageOnly
    ? "h-10 w-10 bg-transparent text-white/45 hover:text-white/90 focus-visible:text-white focus-visible:outline-white/60"
    : `${CLOSE_PX[runtime.closeButtonSize]} ${closeStyle(runtime.closeButtonStyle, theme.dark)} focus-visible:outline-brand`;
  const hasText = !imageOnly && Boolean(content.heading || content.body || (content.ctaLabel && content.ctaUrl));
  // With an image, the countdown lives on the image; otherwise in the body.
  const needsBody = !imageOnly && (
    hasText ||
    (countdownOn && !bannerImage) ||
    !runtime.closeButtonEnabled ||
    (runtime.countdownVisible && !bannerImage)
  );
  const waitLabel = secondsLeft !== null ? `${secondsLeft}s` : "";
  const sheet = placement === "BOTTOM_SHEET";

  const cta =
    !imageOnly && content.ctaLabel && content.ctaUrl ? (
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

  if (imageBroken && !hasText && !countdownOn) return null;

  return (
    <div
      ref={rootRef}
      data-popup-root
      className={`${styles.root} ${position} inset-0 z-[70] flex ${wrapperPlacement} ${modal ? "bg-black/50" : "pointer-events-none"}`}
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
        aria-labelledby={content.heading && !imageOnly ? titleId : undefined}
        aria-label={content.heading && !imageOnly ? undefined : content.heading || content.imageAlt || "Promotion"}
        aria-describedby={content.body && !imageOnly ? bodyId : undefined}
        tabIndex={-1}
        className={`${styles.panel} pointer-events-auto relative w-[calc(100%-22px)] overflow-hidden shadow-2xl outline-none ${WIDTH[popup.design.size]} ${imageOnly ? "bg-charcoal text-white" : theme.panel} ${
          sheet ? `${imageOnly ? "" : "pb-[env(safe-area-inset-bottom)]"}` : ""
        } max-h-[90%] overflow-y-auto md:h-[80%] md:max-h-none md:w-1/2 md:max-w-none md:rounded-none`}
      >
        {showCloseButton && (
          <button
            ref={closeRef}
            type="button"
            aria-label={dismissLocked ? `Close popup (available in ${waitLabel || "a moment"})` : "Close popup"}
            aria-disabled={dismissLocked || undefined}
            onClick={() => onDismiss("manual")}
            className={`absolute top-2 ${closeSide} z-10 inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${closeButtonClasses} ${
              dismissLocked ? "opacity-50" : !imageOnly ? "hover:opacity-90" : ""
            }`}
          >
            <IconClose className={imageOnly ? "h-3.5 w-3.5" : CLOSE_ICON[runtime.closeButtonSize]} aria-hidden="true" />
          </button>
        )}

        {imageUrl && (
          <div className="relative overflow-hidden md:h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={content.imageAlt ?? ""}
              decoding="async"
              fetchPriority="high"
              onLoad={() => setLoadedImage(imageUrl)}
              onError={() => setFailedImage(bannerImage ?? null)}
              data-ready={loadedImage === imageUrl}
              className={`${styles.image} block h-auto w-full object-cover md:h-full md:object-fill`}
            />
            {countdownOn && <OfferCountdown overlay endsAt={popup.countdown!.endsAt!} position={popup.countdown?.position} />}
          </div>
        )}

        {needsBody && (
        <div className={`p-8 pt-10 ${countdownOn ? "text-center" : ""}`}>
          {content.heading && !imageOnly && (
            <h2 id={titleId} className={`text-xl font-bold leading-snug ${countdownOn ? "" : "pr-8"}`}>
              {content.heading}
            </h2>
          )}
          {content.body && !imageOnly && (
            <p id={bodyId} className={`mt-2 text-sm leading-6 ${theme.muted}`}>
              {content.body}
            </p>
          )}
          {countdownOn && !bannerImage && popup.countdown?.endsAt && (
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
        )}
      </div>
    </div>
  );
}
