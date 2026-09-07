import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePhone } from "../api/auth";
import { authKeys } from "./query-keys";

/**
 * Saves a mobile number onto the current account and refreshes the cached
 * `auth/me` user, so a gate keyed on `user.phone` clears immediately.
 */
export function useUpdatePhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (phone: string) => updatePhone(phone),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}
