import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import type { ResolvedLocationDto, ServiceabilityDto } from "./types";
import { LocationServiceError, makeLocationError } from "./errorMessages";

export { LocationServiceError };

const REQUEST_TIMEOUT_MS = 7000;

async function withAbort<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

function toLocationError(err: unknown): LocationServiceError {
  if (err instanceof LocationServiceError) return err;
  if (err instanceof DOMException && err.name === "AbortError") {
    return new LocationServiceError(makeLocationError("TIMEOUT"));
  }
  if (err instanceof ApiError) {
    if (err.status === 0) return new LocationServiceError(makeLocationError("NETWORK"));
    if (err.status === 404) return new LocationServiceError(makeLocationError("GEOCODE_FAILED"));
    return new LocationServiceError(makeLocationError("SEARCH_FAILED"));
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return new LocationServiceError(makeLocationError("NETWORK"));
  }
  return new LocationServiceError(makeLocationError("SEARCH_FAILED"));
}

/** Reverse geocode — coordinates go in the POST body, never a URL/log. */
export async function reverseGeocode(lat: number, lng: number): Promise<ResolvedLocationDto> {
  try {
    const { location } = await withAbort((signal) =>
      apiFetch<{ location: ResolvedLocationDto }>("/location/reverse", {
        method: "POST",
        body: JSON.stringify({ lat, lng }),
        signal,
      })
    );
    return location;
  } catch (err) {
    const mapped = toLocationError(err);
    // A failed reverse geocode specifically means "couldn't name the area".
    if (mapped.detail.code === "GEOCODE_FAILED" || mapped.detail.code === "SEARCH_FAILED") {
      throw new LocationServiceError(makeLocationError("GEOCODE_FAILED"));
    }
    throw mapped;
  }
}

/** City / area / PIN search. `signal` lets callers cancel stale keystrokes. */
export async function searchLocations(
  query: string,
  signal?: AbortSignal
): Promise<ResolvedLocationDto[]> {
  try {
    const { results } = await apiFetch<{ results: ResolvedLocationDto[] }>(
      `/location/search?q=${encodeURIComponent(query)}`,
      { method: "GET", signal }
    );
    return results;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new LocationServiceError(makeLocationError("SEARCH_FAILED"));
  }
}

/** Approximate area from the caller's IP. Never returns coordinates. */
export async function getLocationFromIP(): Promise<ResolvedLocationDto> {
  try {
    const { location } = await withAbort((signal) =>
      apiFetch<{ location: ResolvedLocationDto }>("/location/ip", { method: "GET", signal })
    );
    return location;
  } catch {
    throw new LocationServiceError(makeLocationError("IP_UNAVAILABLE"));
  }
}

export async function checkServiceability(input: {
  pincode?: string;
  country?: string;
}): Promise<ServiceabilityDto> {
  const qs = new URLSearchParams();
  if (input.pincode) qs.set("pincode", input.pincode);
  if (input.country) qs.set("country", input.country);
  try {
    const { serviceability } = await withAbort((signal) =>
      apiFetch<{ serviceability: ServiceabilityDto }>(`/location/serviceability?${qs}`, {
        method: "GET",
        signal,
      })
    );
    return serviceability;
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      throw new LocationServiceError(makeLocationError("INVALID_PIN"));
    }
    throw new LocationServiceError(makeLocationError("SEARCH_FAILED"));
  }
}
