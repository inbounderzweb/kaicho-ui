import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api/auth";
import { authKeys } from "./query-keys";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    // Logout is best-effort from the client's point of view: whether the
    // request succeeded, failed, or timed out, the local session should be
    // treated as gone. The backend still invalidates it server-side; a
    // network hiccup on the way back must not strand the user in a
    // "logged in" UI. onSettled runs on both success and error.
    onSettled: () => {
      queryClient.setQueryData(authKeys.me, null);
    },
  });
}
