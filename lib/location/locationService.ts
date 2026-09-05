import { getCurrentPosition, readPermissionState, watchPermissionState } from "./geolocation";
import {
  reverseGeocode,
  searchLocations,
  getLocationFromIP,
  checkServiceability,
  LocationServiceError,
} from "./locationApi";
import { makeLocationError } from "./errorMessages";
import type { ResolvedLocationDto, StoredLocation, LocationSource } from "./types";

// The single abstraction the UI/state layer depends on (brief §12). The
// browser geolocation API and the geocoding provider are both behind this —
// swapping either is a change confined to ./geolocation.ts or the backend
// provider, never the components.

function toStored(dto: ResolvedLocationDto, source: LocationSource): StoredLocation {
  const out: StoredLocation = {
    displayName: dto.displayName,
    source,
    updatedAt: new Date().toISOString(),
  };
  if (dto.latitude != null) out.latitude = dto.latitude;
  if (dto.longitude != null) out.longitude = dto.longitude;
  if (dto.accuracy != null) out.accuracy = dto.accuracy;
  if (dto.address) out.address = dto.address;
  if (dto.locality) out.locality = dto.locality;
  if (dto.city) out.city = dto.city;
  if (dto.state) out.state = dto.state;
  if (dto.country) out.country = dto.country;
  if (dto.postalCode) out.postalCode = dto.postalCode;
  return out;
}

export const locationService = {
  getCurrentPosition,
  readPermissionState,
  watchPermissionState,
  reverseGeocode,
  searchLocation: searchLocations,
  getLocationFromIP,
  validateServiceability: checkServiceability,

  /**
   * The primary flow (brief §13): browser geolocation → reverse geocode →
   * a structured StoredLocation the caller can persist. Any failure rejects
   * with a typed LocationServiceError.
   */
  async detectAndResolve(): Promise<StoredLocation> {
    const pos = await getCurrentPosition();
    let dto: ResolvedLocationDto;
    try {
      dto = await reverseGeocode(pos.latitude, pos.longitude);
    } catch {
      // We have a real fix but couldn't name the area — still useful; keep
      // the coordinates and a generic label so the user can refine manually.
      throw new LocationServiceError(makeLocationError("GEOCODE_FAILED"));
    }
    return toStored(
      { ...dto, latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy },
      "browser_geolocation"
    );
  },

  /** Approximate, no permission prompt. Flagged source: "ip". */
  async resolveFromIP(): Promise<StoredLocation> {
    const dto = await getLocationFromIP();
    return toStored(dto, "ip");
  },

  /** A user-picked search result / PIN. Flagged source: "manual". */
  fromSelection(dto: ResolvedLocationDto): StoredLocation {
    return toStored(dto, "manual");
  },
};

export type LocationService = typeof locationService;
