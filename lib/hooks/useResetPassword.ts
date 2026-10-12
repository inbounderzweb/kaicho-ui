import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../api/auth";

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPassword(token, password),
  });
}
