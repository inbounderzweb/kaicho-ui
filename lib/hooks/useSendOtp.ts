import { useMutation } from "@tanstack/react-query";
import { sendOtp } from "../api/auth";

export function useSendOtp() {
  return useMutation({
    mutationFn: (phone: string) => sendOtp(phone),
  });
}
