import { useEffect, useState } from "react";

/** Seconds left until `deadline` (ISO), ticking once a second; 0 when past it or unset. */
export function useSecondsLeft(deadline: string | null | undefined): number {
  const target = deadline ? new Date(deadline).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    // The first tick fires from the interval callback (not synchronously in
    // the effect body), so the display is at most a second stale on mount.
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);
  return target ? Math.max(0, Math.floor((target - now) / 1000)) : 0;
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
