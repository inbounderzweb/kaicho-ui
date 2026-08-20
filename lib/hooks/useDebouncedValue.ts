"use client";

import { useEffect, useState } from "react";

// No shared debounce hook existed in this codebase yet (search inputs
// elsewhere use inline setTimeout) — this is the first, and is what
// SearchBox uses to avoid firing a request/URL update on every keystroke.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
