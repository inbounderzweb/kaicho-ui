import type { LocationPermissionState } from "./types";
import { LocationServiceError, makeLocationError } from "./errorMessages";

export interface BrowserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GetPositionOptions {
  timeoutMs?: number;
  /** true = allow a slow, more-accurate GPS fix; false = fast, coarse. */
  highAccuracy?: boolean;
}

// Promise wrapper around navigator.geolocation.getCurrentPosition. Maps every
// failure to a typed LocationServiceError so callers never see a raw
// GeolocationPositionError. This is the ONLY place that calls the browser API
// that triggers a permission prompt.
export function getCurrentPosition({
  timeoutMs = 8000,
  highAccuracy = false,
}: GetPositionOptions = {}): Promise<BrowserPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new LocationServiceError(makeLocationError("UNSUPPORTED")));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new LocationServiceError(makeLocationError("PERMISSION_DENIED")));
            break;
          case err.TIMEOUT:
            reject(new LocationServiceError(makeLocationError("TIMEOUT")));
            break;
          default:
            reject(new LocationServiceError(makeLocationError("POSITION_UNAVAILABLE")));
        }
      },
      { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 }
    );
  });
}

// Reads the current permission state WITHOUT prompting. Returns "unknown" when
// the Permissions API isn't available (e.g. older Safari) — callers must not
// treat "unknown" as "denied".
export async function readPermissionState(): Promise<LocationPermissionState> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return "unsupported";
  }
  if (!("permissions" in navigator) || !navigator.permissions?.query) {
    return "unknown";
  }
  try {
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state as LocationPermissionState;
  } catch {
    return "unknown";
  }
}

// Subscribe to permission changes (revoked in settings, granted elsewhere).
// Returns an unsubscribe fn. No-op when the Permissions API is unavailable.
export async function watchPermissionState(
  onChange: (state: LocationPermissionState) => void
): Promise<() => void> {
  if (
    typeof navigator === "undefined" ||
    !("permissions" in navigator) ||
    !navigator.permissions?.query
  ) {
    return () => {};
  }
  try {
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    const handler = () => onChange(status.state as LocationPermissionState);
    status.addEventListener("change", handler);
    return () => status.removeEventListener("change", handler);
  } catch {
    return () => {};
  }
}
