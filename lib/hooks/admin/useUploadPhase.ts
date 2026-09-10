import { useCallback, useEffect, useRef, useState } from "react";

// The lifecycle every image-upload surface in the admin shares, kept in one
// place so the progress UI reads identically everywhere (see UploadProgress):
//
//   idle → uploading → processing → complete → idle
//                   ↘ error
//
// "uploading"  — bytes are leaving the browser; `percent` tracks the real
//                XHR upload.onprogress event (never a simulated timer).
// "processing" — every byte is sent (percent 100) but the server is still
//                hashing / resizing / writing thumbnails and hasn't replied.
// "complete"   — the response came back OK; shown briefly, then self-clears
//                back to idle so the caller's preview takes over.
// "error"      — network failure or a rejected file; `error` holds the copy.
//                The caller decides what "Retry" does (re-open the picker, or
//                re-send the same file) and passes it to <UploadProgress>.
export type UploadPhase = "idle" | "uploading" | "processing" | "complete" | "error";

const COMPLETE_FLASH_MS = 1200;

export function useUploadPhase() {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFlash = () => {
    if (flashTimer.current) {
      clearTimeout(flashTimer.current);
      flashTimer.current = null;
    }
  };

  useEffect(() => clearFlash, []);

  // `uploading` and `processing` both mean "an upload is in flight" — callers
  // gate their file pickers and submit buttons on this to stop double uploads.
  const isBusy = phase === "uploading" || phase === "processing";

  // Call once, synchronously, right before firing the upload mutation.
  const start = useCallback(() => {
    clearFlash();
    setError(null);
    setPercent(0);
    setPhase("uploading");
  }, []);

  // Wire straight into useUploadMedia's `onProgress`.
  const handleProgress = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(next)));
    setPercent(clamped);
    setPhase((cur) => (cur === "uploading" || cur === "processing" ? (clamped >= 100 ? "processing" : "uploading") : cur));
  }, []);

  const succeed = useCallback(() => {
    clearFlash();
    setPercent(100);
    setPhase("complete");
    flashTimer.current = setTimeout(() => {
      setPhase("idle");
      setPercent(0);
    }, COMPLETE_FLASH_MS);
  }, []);

  // Both a rejected file (client-side validation) and a failed request land
  // here — the surfaced UI is the same either way.
  const failWith = useCallback((message: string) => {
    clearFlash();
    setPhase("error");
    setError(message);
  }, []);

  const reset = useCallback(() => {
    clearFlash();
    setPhase("idle");
    setPercent(0);
    setError(null);
  }, []);

  return { phase, percent, error, isBusy, start, handleProgress, succeed, failWith, reset };
}
