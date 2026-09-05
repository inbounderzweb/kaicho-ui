"use client";

import { useCallback } from "react";
import { useLocationStore, isLocationFresh } from "@/lib/store/location.store";
import { locationService } from "./locationService";
import { locationLabel } from "./types";
import type { ResolvedLocationDto } from "./types";

// The single entry point every component uses to read/act on the current
// location. No page re-implements detection, geocoding, or persistence.
export function useLocation() {
  const location = useLocationStore((s) => s.location);
  const permissionState = useLocationStore((s) => s.permissionState);
  const status = useLocationStore((s) => s.status);
  const lastError = useLocationStore((s) => s.lastError);
  const selectorOpen = useLocationStore((s) => s.selectorOpen);

  const detect = useLocationStore((s) => s.detectCurrent);
  const setManualRaw = useLocationStore((s) => s.setManual);
  const clear = useLocationStore((s) => s.clearLocation);
  const openSelector = useLocationStore((s) => s.openSelector);
  const closeSelector = useLocationStore((s) => s.closeSelector);

  const setManual = useCallback(
    (dto: ResolvedLocationDto) => {
      setManualRaw(dto);
      closeSelector();
    },
    [setManualRaw, closeSelector]
  );

  const search = useCallback(
    (query: string, signal?: AbortSignal) => locationService.searchLocation(query, signal),
    []
  );

  const checkServiceability = useCallback(
    (input: { pincode?: string; country?: string }) =>
      locationService.validateServiceability(input),
    []
  );

  return {
    location,
    label: locationLabel(location),
    isResolved: Boolean(location),
    isFresh: isLocationFresh(location),
    isApproximate: location?.source === "ip",
    permissionState,
    status,
    error: lastError,
    selectorOpen,
    detect,
    setManual,
    clear,
    openSelector,
    closeSelector,
    search,
    checkServiceability,
  };
}
