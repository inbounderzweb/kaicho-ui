import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginWithGoogle } from "../api/auth";
import { authKeys } from "./query-keys";

/**
 * Posts the Google ID token to the backend and, on success, primes the
 * `auth/me` cache with the returned user — same pattern as useVerifyOtp, so
 * the rest of the app sees the session immediately without a refetch.
 */
export function useGoogleLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credential: string) => loginWithGoogle(credential),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}
