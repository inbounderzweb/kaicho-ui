import { useMutation } from "@tanstack/react-query";
import { registerAccount } from "../api/auth";

// No cache priming: registration does NOT create a session, the user has to
// verify their email first.
export function useRegister() {
  return useMutation({ mutationFn: registerAccount });
}
