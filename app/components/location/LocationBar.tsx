"use client";

import { useEffect } from "react";
import { useLocationStore } from "@/lib/store/location.store";
import { useLocation } from "@/lib/location/useLocation";
import { IconMapPin, IconClose } from "../ui/icons";
import LocationModal from "./LocationModal";

// The slim "deliver to" strip rendered by StorefrontChrome between the header
// and the page. Uses only existing design tokens. Never calls the browser
// Geolocation API on mount — only the explicit "Detect" action does.
export default function LocationBar() {
  const { location, label, isApproximate, permissionState, status, detect, openSelector } =
    useLocation();

  const dismissedPromptAt = useLocationStore((s) => s.dismissedPromptAt);
  const dismissPrompt = useLocationStore((s) => s.dismissPrompt);
  const ipFallbackTried = useLocationStore((s) => s.ipFallbackTried);
  const resolveApproxFromIp = useLocationStore((s) => s.resolveApproxFromIp);

  // One quiet, prompt-free IP estimate on first visit so the bar can show an
  // approximate area immediately. Skipped if a location is already stored,
  // the prompt was dismissed, permission is already granted (Detect is the
  // better path), or we've already tried this page load.
  useEffect(() => {
    if (location || dismissedPromptAt || ipFallbackTried || permissionState === "granted") {
      return;
    }
    void resolveApproxFromIp();
  }, [location, dismissedPromptAt, ipFallbackTried, permissionState, resolveApproxFromIp]);

  const inner =
    "mx-auto flex h-9 w-full max-w-[1280px] items-center gap-2 px-5 text-xs sm:px-6 sm:text-[13px] lg:px-8";
  const action =
    "shrink-0 font-semibold text-brand transition-colors hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  const detecting = status === "detecting";
  const blocked = permissionState === "denied" || permissionState === "unsupported";

  return (
    <>
      <div className="border-b border-border bg-cream/60 text-ink-muted">
        {location ? (
          <div className={inner}>
            <IconMapPin className="h-4 w-4 shrink-0 text-brand" />
            <span className="min-w-0 flex-1 truncate">
              Deliver to <span className="font-semibold text-ink">{label}</span>
              {isApproximate && <span className="text-ink-faint"> (approx.)</span>}
            </span>
            <button type="button" onClick={openSelector} className={action}>
              Change
            </button>
          </div>
        ) : detecting ? (
          <div className={inner}>
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
            <span className="min-w-0 flex-1 truncate">Detecting your location…</span>
          </div>
        ) : (
          <div className={inner}>
            <IconMapPin className="h-4 w-4 shrink-0 text-brand" />
            <span className="min-w-0 flex-1 truncate">
              {blocked
                ? "Choose your delivery area"
                : dismissedPromptAt
                  ? "Set your delivery area"
                  : "Deliver to your area?"}
            </span>
            {!blocked && !dismissedPromptAt && (
              <button type="button" onClick={() => void detect()} className={action}>
                Detect
              </button>
            )}
            <button type="button" onClick={openSelector} className={action}>
              {blocked || dismissedPromptAt ? "Choose" : "Change"}
            </button>
            {!blocked && !dismissedPromptAt && (
              <button
                type="button"
                onClick={dismissPrompt}
                aria-label="Dismiss location prompt"
                className="shrink-0 rounded-full p-0.5 text-ink-faint transition-colors hover:text-ink"
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <LocationModal />
    </>
  );
}
