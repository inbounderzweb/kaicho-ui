"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Horizontal card row that can be dragged from ANY pixel — card padding, the
// white gaps between cards, text, buttons — with a finger or a mouse.
//
// Native scrolling alone proved unreliable here: a swipe that starts on a
// non-link part of a card (plain white space) is sometimes not turned into a
// scroll by the browser, and a mouse can't drag-scroll at all. So once the
// page has hydrated, horizontal panning is handled here (the browser keeps
// vertical page scrolling via `touch-action: pan-y`), and on release the row
// glides to the nearest card with the CSS scroll-snap/scroll-smooth it already
// has. Before hydration (or if JS fails) native horizontal scrolling still
// works, because `touch-action` is only restricted from the effect below.
//
// Cards below the sm breakpoint scroll; at sm+ the same element is a static
// grid (no overflow), where this does nothing.
const DRAG_THRESHOLD_PX = 6;
const MOMENTUM_MS = 140;

interface DragState {
  pointerId: number;
  startX: number;
  startLeft: number;
  lastX: number;
  lastT: number;
  velocity: number; // px per ms, positive = finger moving right
  dragging: boolean;
}

export default function SwipeRow({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const swallowClick = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.touchAction = "pan-y";
    return () => { el.style.touchAction = ""; };
  }, []);

  const settle = (el: HTMLDivElement, state: DragState) => {
    el.style.scrollSnapType = "";
    el.style.scrollBehavior = "";
    const rowLeft = el.getBoundingClientRect().left;
    const max = el.scrollWidth - el.clientWidth;
    // Where the row would drift to with a little momentum, then the nearest card start.
    const projected = el.scrollLeft - state.velocity * MOMENTUM_MS;
    let best = el.scrollLeft;
    let bestDistance = Infinity;
    for (const child of Array.from(el.children) as HTMLElement[]) {
      const start = child.getBoundingClientRect().left - rowLeft + el.scrollLeft;
      const distance = Math.abs(start - projected);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = start;
      }
    }
    el.scrollTo({ left: Math.max(0, Math.min(max, best)), behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (el.scrollWidth <= el.clientWidth + 1) return; // not scrollable at this breakpoint
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      dragging: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const state = drag.current;
    if (!el || !state || e.pointerId !== state.pointerId) return;
    const dx = e.clientX - state.startX;
    if (!state.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      state.dragging = true;
      // Only capture once it's clearly a drag, so plain taps keep their normal
      // click target (a captured pointer would redirect the click to the row).
      el.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = "none"; // snap/smooth would fight a live drag
      el.style.scrollBehavior = "auto";
    }
    const dt = e.timeStamp - state.lastT;
    if (dt > 0) state.velocity = 0.8 * state.velocity + 0.2 * ((e.clientX - state.lastX) / dt);
    state.lastX = e.clientX;
    state.lastT = e.timeStamp;
    el.scrollLeft = state.startLeft - dx;
  };

  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const state = drag.current;
    if (!el || !state || e.pointerId !== state.pointerId) return;
    drag.current = null;
    if (!state.dragging) return;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    // The drag must not also "click" whatever card/button it ended on.
    swallowClick.current = true;
    setTimeout(() => { swallowClick.current = false; }, 0);
    // A cancelled pointer (the browser took over, e.g. a vertical page scroll) just restores snapping.
    if (e.type === "pointercancel") {
      el.style.scrollSnapType = "";
      el.style.scrollBehavior = "";
      return;
    }
    settle(el, state);
  };

  return (
    <div
      ref={ref}
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onClickCapture={(e) => {
        if (swallowClick.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
    </div>
  );
}
