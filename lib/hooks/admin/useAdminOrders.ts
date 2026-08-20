import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAdminOrders, type PageParams } from "../../api/admin";
import { adminKeys } from "../query-keys";

export function useAdminOrders({ page = 1, pageSize = 10 }: PageParams = {}) {
  return useQuery({
    queryKey: adminKeys.orders(page, pageSize),
    queryFn: () => fetchAdminOrders({ page, pageSize }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
