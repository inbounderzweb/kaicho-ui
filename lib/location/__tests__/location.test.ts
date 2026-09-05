import { describe, it, expect, vi, afterEach } from "vitest";
import {
  makeLocationError,
  locationErrorMessage,
  LocationServiceError,
} from "../errorMessages";
import type { LocationErrorCode, StoredLocation } from "../types";
import { locationLabel } from "../types";
import { isLocationFresh } from "@/lib/store/location.store";

const ALL_CODES: LocationErrorCode[] = [
  "PERMISSION_DENIED",
  "POSITION_UNAVAILABLE",
  "TIMEOUT",
  "UNSUPPORTED",
  "GEOCODE_FAILED",
  "IP_UNAVAILABLE",
  "NETWORK",
  "INVALID_PIN",
  "SEARCH_FAILED",
];

describe("errorMessages", () => {
  it("has a non-empty, non-technical message for every error code", () => {
    for (const code of ALL_CODES) {
      const msg = locationErrorMessage(code);
      expect(msg.length).toBeGreaterThan(10);
      expect(msg.toLowerCase()).not.toMatch(/undefined|null|error:|exception|http \d|stack/);
    }
  });

  it("makeLocationError round-trips the code + message", () => {
    const e = makeLocationError("TIMEOUT");
    expect(e).toEqual({ code: "TIMEOUT", message: locationErrorMessage("TIMEOUT") });
  });

  it("LocationServiceError carries the typed detail", () => {
    const err = new LocationServiceError(makeLocationError("PERMISSION_DENIED"));
    expect(err).toBeInstanceOf(Error);
    expect(err.detail.code).toBe("PERMISSION_DENIED");
  });
});

describe("locationLabel", () => {
  it("prefers city, then locality, then displayName", () => {
    const base: StoredLocation = { displayName: "Full, Name", source: "manual", updatedAt: "x" };
    expect(locationLabel({ ...base, city: "Pune" })).toBe("Pune");
    expect(locationLabel({ ...base, locality: "Baner" })).toBe("Baner");
    expect(locationLabel(base)).toBe("Full, Name");
    expect(locationLabel(null)).toBe("");
  });
});

describe("isLocationFresh", () => {
  const withAge = (days: number): StoredLocation => ({
    displayName: "Bengaluru",
    city: "Bengaluru",
    source: "browser_geolocation",
    updatedAt: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
  });

  it("is false for null / no identifiable area", () => {
    expect(isLocationFresh(null)).toBe(false);
    expect(
      isLocationFresh({ displayName: "?", source: "ip", updatedAt: new Date().toISOString() })
    ).toBe(false);
  });

  it("is true for a recent located area and false once stale", () => {
    expect(isLocationFresh(withAge(1))).toBe(true);
    expect(isLocationFresh(withAge(29))).toBe(true);
    expect(isLocationFresh(withAge(31))).toBe(false);
  });
});

describe("geolocation.getCurrentPosition (error mapping)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function importFresh() {
    vi.resetModules();
    return import("../geolocation");
  }

  it("rejects UNSUPPORTED when navigator.geolocation is missing", async () => {
    vi.stubGlobal("navigator", {});
    const { getCurrentPosition } = await importFresh();
    await expect(getCurrentPosition()).rejects.toMatchObject({ detail: { code: "UNSUPPORTED" } });
  });

  it("maps PERMISSION_DENIED / TIMEOUT / POSITION_UNAVAILABLE", async () => {
    const codes = { PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
    for (const [name, code] of Object.entries(codes)) {
      vi.stubGlobal("navigator", {
        geolocation: {
          getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) =>
            fail({ code, ...codes }),
        },
      });
      const { getCurrentPosition } = await importFresh();
      const expected = name === "POSITION_UNAVAILABLE" ? "POSITION_UNAVAILABLE" : name;
      await expect(getCurrentPosition()).rejects.toMatchObject({ detail: { code: expected } });
    }
  });

  it("resolves with a plain lat/lng/accuracy on success", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (ok: (p: unknown) => void) =>
          ok({ coords: { latitude: 12.9, longitude: 77.6, accuracy: 42 } }),
      },
    });
    const { getCurrentPosition } = await importFresh();
    await expect(getCurrentPosition()).resolves.toEqual({
      latitude: 12.9,
      longitude: 77.6,
      accuracy: 42,
    });
  });

  it("readPermissionState returns 'unsupported' without a geolocation API", async () => {
    vi.stubGlobal("navigator", {});
    const { readPermissionState } = await importFresh();
    await expect(readPermissionState()).resolves.toBe("unsupported");
  });
});
