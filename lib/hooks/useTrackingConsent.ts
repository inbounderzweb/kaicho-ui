import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteInteractionData, updateTrackingConsent } from "../api/interaction";
import type { AuthUser } from "../api/auth";
import { authKeys } from "./query-keys";
import { useCurrentUser } from "./useCurrentUser";

export interface ConsentView {
  granted: boolean;
  /** null = the customer has never answered. */
  updatedAt: string | null;
}

// Derived from the /auth/me response the app already has cached - consent
// costs no request of its own. `data` is undefined for signed-out visitors AND
// when the backend has interaction tracking switched off (it then omits the
// field entirely), so the banner, the Privacy tab and the tracker all vanish.
export function useTrackingConsent(): { data: ConsentView | undefined; isLoading: boolean; isError: boolean } {
  const { data: user, isLoading, isError } = useCurrentUser();
  return {
    data: user && user.trackingConsent !== undefined
      ? { granted: user.trackingConsent?.granted === true, updatedAt: user.trackingConsent?.updatedAt ?? null }
      : undefined,
    isLoading,
    isError,
  };
}

export function useUpdateTrackingConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTrackingConsent,
    // Write the answer into the cached user instead of re-fetching it.
    onSuccess: (consent) =>
      queryClient.setQueryData<AuthUser | null>(authKeys.me, (user) =>
        user
          ? { ...user, trackingConsent: { granted: consent.granted, updatedAt: consent.updatedAt ?? new Date().toISOString() } }
          : user
      ),
  });
}

export function useDeleteInteractionData() {
  return useMutation({ mutationFn: deleteInteractionData });
}
