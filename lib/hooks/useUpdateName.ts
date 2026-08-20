import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateName } from "../api/auth";
import { authKeys } from "./query-keys";

export function useUpdateName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => updateName(name),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}
