import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../api/auth";
import { authKeys } from "./query-keys";

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
