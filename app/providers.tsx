"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCartStore } from "@/lib/store/cart.store";
import { useLocationStore } from "@/lib/store/location.store";
import { useAuthStore } from "@/lib/store/auth.store";
import InteractionTrackingProvider from "./components/interaction/InteractionTrackingProvider";
import AddToCartToast from "./components/cart/AddToCartToast";
import TrackingConsentBanner from "./components/interaction/TrackingConsentBanner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // Keep fetched data in memory for 10 min after it's unused, so
            // navigating back to a page doesn't refire its queries.
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    useCartStore.persist.rehydrate();
    // Same skipHydration pattern as the cart. Once the persisted location is
    // loaded, sync the (non-prompting) browser permission state so the
    // location bar knows whether it's allowed to offer "detect".
    useLocationStore.persist.rehydrate();
    useLocationStore.getState().refreshPermissionState();
    // Restores an in-progress OTP resend cooldown (and the OTP screen it
    // belongs to) after a tab close/reopen — see auth.store.ts's merge().
    useAuthStore.persist.rehydrate();
  }, []);

  // The cart lives in localStorage. Without this, a second tab keeps showing
  // (and adding to) a stale copy until it is reloaded, and the last tab to
  // write silently overwrites the other's items.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "kaicho-cart") void useCartStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <InteractionTrackingProvider />
      <TrackingConsentBanner />
      <AddToCartToast />
    </QueryClientProvider>
  );
}
