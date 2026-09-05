// Where a stored location came from. Drives how it's labelled in the UI
// (an IP guess is shown as "approx.").
export type LocationSource = "browser_geolocation" | "ip" | "manual";

// Mirrors the browser Permissions API plus two states it doesn't model:
// "unsupported" (no navigator.geolocation at all) and "unknown" (we haven't
// / can't check without prompting).
export type LocationPermissionState =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported";

export type LocationErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "UNSUPPORTED"
  | "GEOCODE_FAILED"
  | "IP_UNAVAILABLE"
  | "NETWORK"
  | "INVALID_PIN"
  | "SEARCH_FAILED";

export interface LocationError {
  code: LocationErrorCode;
  /** User-safe message. Never a raw provider/exception string. */
  message: string;
}

// The structured record persisted to localStorage. Only fields the geocoding
// provider actually returned are set (undefined keys are dropped on save).
// Same shape the backend's ResolvedLocation produces, plus `source` +
// `updatedAt` which the client stamps.
export interface StoredLocation {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  /** Short human label, e.g. "Bengaluru, Karnataka". Always present. */
  displayName: string;
  source: LocationSource;
  /** ISO timestamp of when this was resolved/selected. */
  updatedAt: string;
}

// The raw normalized shape returned by /api/location/* (no source/updatedAt).
export interface ResolvedLocationDto {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  displayName: string;
  provider: "nominatim" | "ipapi" | "google" | "mapbox";
  approximate: boolean;
}

export interface ServiceabilityDto {
  serviceable: boolean;
  pincode?: string;
  note: string;
}

/** Best single-line label for a stored location. */
export function locationLabel(loc: StoredLocation | null): string {
  if (!loc) return "";
  return loc.city || loc.locality || loc.displayName || "Selected area";
}
