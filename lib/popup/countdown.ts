export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  /** Under an hour left — the popup switches to its "panic" styling. */
  urgent: boolean;
}

export const URGENT_BELOW_MS = 60 * 60 * 1000;

/** Split the time until `endsAt` into d/h/m/s. null = no/invalid date or already over. */
export function countdownParts(endsAt: string | null | undefined, now: number): CountdownParts | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(end)) return null;
  const totalMs = end - now;
  if (totalMs <= 0) return null;
  const total = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    totalMs,
    urgent: totalMs < URGENT_BELOW_MS,
  };
}
