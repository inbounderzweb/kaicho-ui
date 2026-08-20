"use client";

// Controlled quantity stepper for the product detail page's add-to-cart
// control. `max` (when provided) is a stock snapshot used only to cap the
// stepper in the UI — never treated as authoritative; the backend still
// re-validates stock whenever a real order is placed.
export default function QuantitySelector({
  value,
  onChange,
  max,
  min = 1,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
}) {
  const atMax = typeof max === "number" && value >= max;
  const atMin = value <= min;

  return (
    <div
      role="group"
      aria-label="Quantity"
      className="inline-flex items-center rounded-full border border-border"
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || atMin}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-11 w-10 items-center justify-center text-lg text-ink-muted transition-colors hover:text-brand disabled:opacity-30"
      >
        −
      </button>
      <span aria-live="polite" className="w-8 text-center text-sm font-semibold text-ink">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || atMax}
        onClick={() => onChange(typeof max === "number" ? Math.min(max, value + 1) : value + 1)}
        className="flex h-11 w-10 items-center justify-center text-lg text-ink-muted transition-colors hover:text-brand disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
