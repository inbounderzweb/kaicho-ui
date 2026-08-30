import { useQuery } from "@tanstack/react-query";
import { fetchAdminOrderDetail } from "../../api/admin";
import { adminKeys } from "../query-keys";
import { ApiError } from "../../api/ApiError";

export function useAdminOrderDetail(id: string | null) {
  return useQuery({
    queryKey: adminKeys.orderDetail(id ?? ""),
    queryFn: () => fetchAdminOrderDetail(id!),
    enabled: Boolean(id),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return false;
      return failureCount < 2;
    },
  });
}
