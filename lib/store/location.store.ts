import { create } from "zustand";
import { persist } from "zustand/middleware";
import { locationService } from "@/lib/location/locationService";
import { LocationServiceError, makeLocationError } from "@/lib/location/errorMessages";
import type {
  LocationError,
  LocationPermissionState,
  ResolvedLocationDto,
  StoredLocation,
} from "@/lib/location/types";

// A stored location is considered "fresh enough to trust without re-asking"
// for this long. After that the bar still shows it, but a returning visitor
// is gently offered a refresh.
const FRESH_FOR_DAYS = 30;

type DetectStatus = "idle" | "detecting" | "error";

interface LocationStoreState {
  location: StoredLocation | null;
  permissionState: LocationPermissionState;
  status: DetectStatus;
  lastError: LocationError | null;
  /** Epoch ms of when the visitor dismissed the "set your area" prompt. */
  dismissedPromptAt: number | null;
  /** Whether the change-location modal is open. */
  selectorOpen: boolean;
  /** Guards the one-time silent IP fallback in LocationBar. */
  ipFallbackTried: boolean;

  setLocation: (loc: StoredLocation) => void;
  clearLocation: () => void;
  setPermissionState: (state: LocationPermissionState) => void;
  refreshPermissionState: () => Promise<void>;
  dismissPrompt: () => void;
  openSelector: () => void;
  closeSelector: () => void;
  markIpFallbackTried: () => void;

  /** Browser geolocation → reverse geocode → persist. */
  detectCurrent: () => Promise<void>;
  /** Silent IP-based approximate area (no permission prompt). */
  resolveApproxFromIp: () => Promise<void>;
  /** Persist a user-selected search result / PIN. */
  setManual: (dto: ResolvedLocationDto) => void;
}

export const useLocationStore = create<LocationStoreState>()(
  persist(
    (set, get) => ({
      location: null,
      permissionState: "unknown",
      status: "idle",
      lastError: null,
      dismissedPromptAt: null,
      selectorOpen: false,
      ipFallbackTried: false,

      setLocation: (loc) => set({ location: loc, status: "idle", lastError: null }),
      clearLocation: () => set({ location: null, lastError: null }),
      setPermissionState: (state) => set({ permissionState: state }),
      refreshPermissionState: async () => {
        const state = await locationService.readPermissionState();
        set({ permissionState: state });
      },
      dismissPrompt: () => set({ dismissedPromptAt: Date.now() }),
      openSelector: () => set({ selectorOpen: true }),
      closeSelector: () => set({ selectorOpen: false }),
      markIpFallbackTried: () => set({ ipFallbackTried: true }),

      detectCurrent: async () => {
        set({ status: "detecting", lastError: null });
        try {
          const resolved = await locationService.detectAndResolve();
          set({ location: resolved, status: "idle", lastError: null });
          // A successful fix means permission is granted — reflect it.
          get().refreshPermissionState();
        } catch (err) {
          const detail =
            err instanceof LocationServiceError
              ? err.detail
              : makeLocationError("POSITION_UNAVAILABLE");
          set({ status: "error", lastError: detail });
          get().refreshPermissionState();
        }
      },

      resolveApproxFromIp: async () => {
        try {
          const resolved = await locationService.resolveFromIP();
          // Never overwrite a precise/manual location with an IP guess.
          if (!get().location) set({ location: resolved });
        } catch {
          // Silent — the "set your area" prompt simply stays visible.
        } finally {
          set({ ipFallbackTried: true });
        }
      },

      setManual: (dto) =>
        set({
          location: locationService.fromSelection(dto),
          status: "idle",
          lastError: null,
        }),
    }),
    {
      name: "kaicho-location",
      // Same rationale as cart.store.ts: the server has no localStorage, so it
      // renders the default (null). Reading storage synchronously on store
      // creation would make the first client render differ from the SSR HTML
      // and trip a hydration mismatch. Providers calls rehydrate() post-mount.
      skipHydration: true,
      version: 1,
      // Only durable fields are persisted — transient UI/detection state
      // (status, lastError, selectorOpen, ipFallbackTried) always starts fresh.
      partialize: (state) => ({
        location: state.location,
        permissionState: state.permissionState,
        dismissedPromptAt: state.dismissedPromptAt,
      }),
      migrate: (persisted) => {
        const s = persisted as Partial<LocationStoreState> | undefined;
        const loc = s?.location;
        const valid =
          loc != null &&
          typeof loc.displayName === "string" &&
          typeof loc.updatedAt === "string";
        return {
          location: valid ? (loc as StoredLocation) : null,
          permissionState: (s?.permissionState as LocationPermissionState) ?? "unknown",
          dismissedPromptAt:
            typeof s?.dismissedPromptAt === "number" ? s.dismissedPromptAt : null,
        };
      },
    }
  )
);

// ---- selectors ------------------------------------------------------------

export function isLocationFresh(loc: StoredLocation | null): boolean {
  if (!loc) return false;
  if (!loc.city && !loc.postalCode && !loc.locality) return false;
  const ageMs = Date.now() - new Date(loc.updatedAt).getTime();
  return Number.isFinite(ageMs) && ageMs < FRESH_FOR_DAYS * 24 * 60 * 60 * 1000;
}
