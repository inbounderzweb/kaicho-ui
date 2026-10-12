import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginWithPassword } from "../api/auth";
import { authKeys } from "./query-keys";

export function usePasswordLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginWithPassword(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}
