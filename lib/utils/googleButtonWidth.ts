// Google's "Continue with" button is drawn by Google's script at a fixed pixel
// width, so it has to be redrawn when its container's WIDTH changes. It must
// NOT be redrawn for any other reason: redrawing empties the container (its
// height collapses to 0 until Google's iframe is back), and a ResizeObserver
// on that container reports the height change as a resize, which redraws
// again, forever — the login page blinked and re-fetched the button ~7x/sec.
// Gate every redraw on "did the clamped width actually change".

export const MIN_BUTTON_WIDTH = 200;
export const MAX_BUTTON_WIDTH = 400;
export const DEFAULT_BUTTON_WIDTH = 320;

/** The pixel width to ask Google for, from the container's measured width. */
export function clampButtonWidth(measured: number | undefined): number {
  const raw = Number.isFinite(measured) ? Math.floor(measured as number) : DEFAULT_BUTTON_WIDTH;
  return Math.min(MAX_BUTTON_WIDTH, Math.max(MIN_BUTTON_WIDTH, raw || DEFAULT_BUTTON_WIDTH));
}

/** Remembers the width last drawn and says whether a new measurement needs a redraw. */
export function createWidthGate() {
  let drawn: number | null = null;
  return {
    /** True when `width` differs from what is currently drawn (or nothing is drawn yet). */
    needsRedraw: (width: number) => drawn !== width,
    markDrawn: (width: number) => {
      drawn = width;
    },
  };
}
