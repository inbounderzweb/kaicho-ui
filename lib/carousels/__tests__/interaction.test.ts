import { describe, expect, it, vi } from "vitest";
import { monitorCarouselInteraction } from "../interaction";

function harness() {
  let time = 0;
  const windowTarget = new EventTarget();
  const element = Object.assign(new EventTarget(), { ownerDocument: { defaultView: windowTarget } });
  const interrupt = vi.fn();
  const monitor = monitorCarouselInteraction(element as unknown as HTMLElement, {
    pauseMs: 3000, now: () => time, onInterrupt: interrupt,
  });
  return {
    monitor, interrupt,
    advance(ms: number) { time += ms; },
    emit(name: string, fields = {}, onWindow = false) {
      (onWindow ? windowTarget : element).dispatchEvent(Object.assign(new Event(name), fields));
    },
  };
}

describe("carousel interaction pause", () => {
  it("keeps autoplay paused throughout a long touch, then waits after release", () => {
    const h = harness();
    h.emit("pointerdown", { pointerId: 1 });
    h.emit("touchstart", { touches: [{}] });
    h.advance(10_000);
    expect(h.monitor.canAutoplay()).toBe(false);
    // Native scrolling cancels the pointer stream but the finger is still down.
    h.emit("pointercancel", { pointerId: 1 }, true);
    expect(h.monitor.isActive()).toBe(true);
    h.emit("touchend", { touches: [] }, true);
    expect(h.monitor.isActive()).toBe(false);
    expect(h.monitor.canAutoplay()).toBe(false);
    h.advance(3000);
    expect(h.monitor.canAutoplay()).toBe(true);
  });

  it("waits for native momentum to settle before restarting autoplay", () => {
    const h = harness();
    h.emit("touchstart", { touches: [{}] });
    h.emit("touchend", { touches: [] }, true);
    for (let index = 0; index < 5; index += 1) { h.advance(2000); h.emit("scroll"); }
    expect(h.monitor.canAutoplay()).toBe(false);
    h.advance(2999);
    expect(h.monitor.canAutoplay()).toBe(false);
    h.advance(1);
    expect(h.monitor.canAutoplay()).toBe(true);
  });

  it("interrupts animation and pending rewind immediately when a gesture begins", () => {
    const h = harness();
    h.emit("pointerdown", { pointerId: 1 });
    h.emit("wheel");
    h.emit("keydown");
    expect(h.interrupt).toHaveBeenCalledTimes(3);
    h.advance(5000);
    expect(h.monitor.canAutoplay()).toBe(false);
    h.emit("pointerup", { pointerId: 1 }, true);
    h.advance(3000);
    expect(h.monitor.canAutoplay()).toBe(true);
  });

  it("ignores unrelated releases and waits until all tracked pointers are released", () => {
    const h = harness();
    h.emit("pointerdown", { pointerId: 1 });
    h.emit("pointerdown", { pointerId: 2 });
    h.emit("pointerup", { pointerId: 3 }, true);
    h.emit("pointerup", { pointerId: 1 }, true);
    h.advance(5000);
    expect(h.monitor.canAutoplay()).toBe(false);
    h.emit("pointerup", { pointerId: 2 }, true);
    h.advance(3000);
    expect(h.monitor.canAutoplay()).toBe(true);
  });

  it("pauses mouse hover without treating touch entry as a sticky mouse hover", () => {
    const h = harness();
    h.emit("pointerenter", { pointerType: "touch" });
    h.advance(3000);
    expect(h.monitor.canAutoplay()).toBe(true);
    h.emit("pointerenter", { pointerType: "mouse" });
    expect(h.monitor.canAutoplay()).toBe(false);
    h.emit("pointerleave", { pointerType: "mouse" });
    h.advance(3000);
    expect(h.monitor.canAutoplay()).toBe(true);
  });

  it("removes interaction listeners when the carousel unmounts", () => {
    const h = harness();
    h.monitor.dispose();
    h.emit("pointerdown", { pointerId: 1 });
    h.emit("touchstart", { touches: [{}] });
    h.advance(3000);
    expect(h.monitor.canAutoplay()).toBe(true);
    expect(h.interrupt).not.toHaveBeenCalled();
  });
});
