import { useQuery } from "@tanstack/react-query";
import { fetchActiveOffers } from "../api/offer";
import { publicOfferKeys } from "./query-keys";

// One shared query for the whole storefront — every product card calls this
// hook, but react-query dedupes it to a single request (no N+1). Display
// data only; a minute of staleness is harmless because the cart and checkout
// re-evaluate on the server.
export function useActiveOffers() {
  return useQuery({
    queryKey: publicOfferKeys.active,
    queryFn: async () => (await fetchActiveOffers()).offers,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
