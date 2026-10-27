import { describe, expect, it } from "vitest";
import { clampButtonWidth, createWidthGate } from "../googleButtonWidth";

describe("clampButtonWidth", () => {
  it("clamps to Google's 200-400px range and floors fractions", () => {
    expect(clampButtonWidth(120)).toBe(200);
    expect(clampButtonWidth(345.8)).toBe(345);
    expect(clampButtonWidth(900)).toBe(400);
  });
  it("falls back to a sensible width when unmeasured", () => {
    expect(clampButtonWidth(undefined)).toBe(320);
    expect(clampButtonWidth(0)).toBe(320);
    expect(clampButtonWidth(NaN)).toBe(320);
  });
});

describe("width gate", () => {
  it("draws the first time, then only when the width really changes", () => {
    const gate = createWidthGate();
    expect(gate.needsRedraw(345)).toBe(true);
    gate.markDrawn(345);
    expect(gate.needsRedraw(345)).toBe(false);
    expect(gate.needsRedraw(300)).toBe(true);
  });

  // Regression: redrawing empties the container, collapsing its HEIGHT; a
  // ResizeObserver reports that as a resize. With the gate the feedback loop
  // dies after the first redraw instead of running forever (34 redraws in 5s live).
  it("does not loop when a redraw itself triggers more resize notifications", () => {
    const gate = createWidthGate();
    let draws = 0;
    const onResize = (measuredWidth: number) => {
      const width = clampButtonWidth(measuredWidth);
      if (!gate.needsRedraw(width)) return;
      gate.markDrawn(width);
      draws++;
      // The redraw shrinks then restores the container's height; the observer fires again at the same width.
      for (let echo = 0; echo < 50; echo++) onResize(measuredWidth);
    };
    onResize(345);
    expect(draws).toBe(1);
  });
});
