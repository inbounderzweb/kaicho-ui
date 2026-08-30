import { useQuery } from "@tanstack/react-query";
import { fetchOrder } from "../api/order";
import { orderKeys } from "./query-keys";
import { ApiError } from "../api/ApiError";

// Keyed by orderNumber (the customer-visible identifier in the URL), not
// the internal id. 404 means "no such order, or not yours" — retrying
// won't change either answer, so retry is disabled for it and the page
// renders a not-found state instead.
export function useOrder(orderNumber: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderNumber),
    queryFn: () => fetchOrder(orderNumber),
    enabled: Boolean(orderNumber),
    staleTime: 15_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return false;
      return failureCount < 2;
    },
  });
}
