import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAdminOrders, type AdminOrdersQueryParams } from "../../api/admin";
import { adminKeys } from "../query-keys";

export function useAdminOrders({ page = 1, pageSize = 10, status, paymentStatus }: AdminOrdersQueryParams = {}) {
  const params: AdminOrdersQueryParams = { page, pageSize, status, paymentStatus };

  return useQuery({
    queryKey: adminKeys.orders(params),
    queryFn: () => fetchAdminOrders(params),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
