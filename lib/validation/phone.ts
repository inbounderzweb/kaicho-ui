// Client mirror of kaicho-be/src/common/utils/phone.ts — the backend re-checks
// and normalises; this is inline feedback for the inquiry forms.

export function normalizeIndianMobile(raw: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  let core = digits;
  if (core.length === 12 && core.startsWith("91")) core = core.slice(2);
  else if (core.length === 11 && core.startsWith("0")) core = core.slice(1);
  return /^[6-9]\d{9}$/.test(core) ? core : null;
}

export function isValidIndianMobile(raw: string): boolean {
  return normalizeIndianMobile(raw) !== null;
}

export const MOBILE_ERROR = "Enter a valid 10-digit mobile number";
