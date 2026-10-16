interface Options {
  pauseMs: number;
  onInterrupt?: () => void;
  isAnimating?: () => boolean;
  now?: () => number;
}

// A touch can remain down longer than the autoplay delay, and momentum can
// continue after release. Wait for both release AND a quiet scrolling period.
export function monitorCarouselInteraction(element: HTMLElement, options: Options) {
  const now = options.now ?? Date.now;
  let lastActivity = now();
  const pointers = new Set<number>();
  let touches = 0;
  let hovering = false;
  const cleanup: (() => void)[] = [];
  const markActivity = () => { lastActivity = now(); };
  const interrupt = () => { markActivity(); options.onInterrupt?.(); };
  const listen = <T extends Event>(target: EventTarget, name: string, handler: (event: T) => void) => {
    target.addEventListener(name, handler as EventListener, { passive: true });
    cleanup.push(() => target.removeEventListener(name, handler as EventListener));
  };
  const releaseTarget = element.ownerDocument.defaultView ?? element;

  listen<PointerEvent>(element, "pointerdown", (event) => { pointers.add(event.pointerId); interrupt(); });
  const releasePointer = (event: PointerEvent) => { if (pointers.delete(event.pointerId)) markActivity(); };
  listen(releaseTarget, "pointerup", releasePointer);
  listen(releaseTarget, "pointercancel", releasePointer);
  listen<TouchEvent>(element, "touchstart", (event) => { touches = event.touches.length; interrupt(); });
  const releaseTouch = (event: TouchEvent) => {
    if (!touches) return;
    touches = event.touches.length;
    markActivity();
  };
  listen(releaseTarget, "touchend", releaseTouch);
  listen(releaseTarget, "touchcancel", releaseTouch);
  listen(element, "wheel", interrupt);
  listen(element, "keydown", interrupt);
  listen(element, "scroll", () => { if (!options.isAnimating?.()) markActivity(); });
  listen<PointerEvent>(element, "pointerenter", (event) => { if (event.pointerType === "mouse") hovering = true; });
  listen<PointerEvent>(element, "pointerleave", (event) => {
    if (event.pointerType === "mouse") { hovering = false; markActivity(); }
  });

  const isActive = () => pointers.size > 0 || touches > 0;
  return {
    isActive,
    markActivity,
    canAutoplay: () => !hovering && !isActive() && now() - lastActivity >= options.pauseMs,
    dispose: () => { cleanup.forEach((remove) => remove()); },
  };
}
