import { useQuery } from "@tanstack/react-query";
import { fetchAdminDashboard } from "../../api/admin";
import { adminKeys } from "../query-keys";

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: fetchAdminDashboard,
    staleTime: 60_000,
  });
}
