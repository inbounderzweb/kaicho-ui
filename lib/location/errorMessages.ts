import type { LocationError, LocationErrorCode } from "./types";

// Every user-facing string the location feature can show. Keeps technical
// detail (provider names, exception text, HTTP codes) out of the UI — brief §11.
const MESSAGES: Record<LocationErrorCode, string> = {
  PERMISSION_DENIED:
    "Location access is turned off for this site. Turn it on in your browser settings, or pick your area below.",
  POSITION_UNAVAILABLE:
    "We couldn't get your current location. Please try again or choose your area below.",
  TIMEOUT:
    "Finding your location is taking longer than expected. Please try again or choose your area below.",
  UNSUPPORTED:
    "Your browser can't share your location. Please choose your area below.",
  GEOCODE_FAILED:
    "We found your position but couldn't work out the area. Please choose it below.",
  IP_UNAVAILABLE: "We couldn't estimate your area automatically.",
  NETWORK:
    "You seem to be offline. Please check your connection and try again.",
  INVALID_PIN: "Enter a valid 6-digit PIN code.",
  SEARCH_FAILED: "Couldn't search right now. Please try again in a moment.",
};

export function locationErrorMessage(code: LocationErrorCode): string {
  return MESSAGES[code] ?? MESSAGES.POSITION_UNAVAILABLE;
}

export function makeLocationError(code: LocationErrorCode): LocationError {
  return { code, message: locationErrorMessage(code) };
}

// A rejected location operation always carries a typed, user-safe LocationError.
export class LocationServiceError extends Error {
  readonly detail: LocationError;
  constructor(detail: LocationError) {
    super(detail.message);
    this.name = "LocationServiceError";
    this.detail = detail;
  }
}
