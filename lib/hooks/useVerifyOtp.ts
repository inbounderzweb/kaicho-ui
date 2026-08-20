import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyOtp } from "../api/auth";
import { authKeys } from "./query-keys";

export function useVerifyOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      verifyOtp(phone, otp),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}
