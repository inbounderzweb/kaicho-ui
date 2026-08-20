import { useQuery } from "@tanstack/react-query";
import { fetchAdminUserDetail } from "../../api/admin";
import { adminKeys } from "../query-keys";

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: adminKeys.userDetail(id),
    queryFn: () => fetchAdminUserDetail(id).then((res) => res.user),
    staleTime: 30_000,
    retry: false,
  });
}
