"use client";

import { useLocation } from "@/lib/location/useLocation";
import { IconMapPin } from "../ui/icons";
import LocationModal from "./LocationModal";

// The slim "deliver to" strip rendered by StorefrontChrome between the header
// and the page. Uses only existing design tokens. Never calls the browser
// Geolocation API on mount — only the explicit "Detect" action does.
//
// "Deliver to …" is shown only for a location the customer actually chose or
// detected. With none, or only an approximate (IP-based) guess, the bar asks
// them to choose one instead of presenting a guess as their delivery area.
export default function LocationBar() {
  const { location, label, isApproximate, permissionState, status, detect, openSelector } = useLocation();

  const inner =
    "mx-auto flex h-9 w-full max-w-[1280px] items-center gap-2 px-5 text-xs sm:px-6 sm:text-[13px] lg:px-8";
  const action =
    "shrink-0 font-semibold text-brand transition-colors hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  const detecting = status === "detecting";
  const blocked = permissionState === "denied" || permissionState === "unsupported";
  const confirmedLocation = location && !isApproximate;

  return (
    <>
      <div className="border-b border-border bg-cream/60 text-ink-muted">
        {confirmedLocation ? (
          <div className={inner}>
            <IconMapPin className="h-4 w-4 shrink-0 text-brand" />
            <span className="min-w-0 flex-1 truncate">
              Deliver to <span className="font-semibold text-ink">{label}</span>
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
            <button type="button" onClick={openSelector} className={`min-w-0 flex-1 truncate text-left ${action}`}>
              Choose location
            </button>
            {!blocked && (
              <button type="button" onClick={() => void detect()} className={action}>
                Detect
              </button>
            )}
          </div>
        )}
      </div>

      <LocationModal />
    </>
  );
}
