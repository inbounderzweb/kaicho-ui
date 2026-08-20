import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api/auth";
import { authKeys } from "./query-keys";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
    },
  });
}
