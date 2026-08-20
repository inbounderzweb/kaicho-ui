import { useQuery } from "@tanstack/react-query";
import { fetchAdminUserStats } from "../../api/admin";
import { adminKeys } from "../query-keys";

export function useAdminUserStats() {
  return useQuery({
    queryKey: adminKeys.userStats,
    queryFn: fetchAdminUserStats,
    staleTime: 60_000,
  });
}
