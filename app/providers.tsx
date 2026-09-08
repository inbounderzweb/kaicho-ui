"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCartStore } from "@/lib/store/cart.store";
import { useLocationStore } from "@/lib/store/location.store";
import { useAuthStore } from "@/lib/store/auth.store";

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

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
