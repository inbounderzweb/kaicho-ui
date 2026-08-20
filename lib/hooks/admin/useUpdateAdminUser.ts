import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminUser, type UpdateUserInput } from "../../api/admin";
import { adminKeys } from "../query-keys";

export function useUpdateAdminUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdateUserInput) => updateAdminUser(id, patch),
    onSuccess: (res) => {
      // Reflect the edit immediately in the detail view...
      queryClient.setQueryData(adminKeys.userDetail(id), res.user);
      // ...and make sure the list (whatever filters/page it's currently on)
      // refetches rather than showing stale data for this row.
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "list"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.userStats });
    },
  });
}
