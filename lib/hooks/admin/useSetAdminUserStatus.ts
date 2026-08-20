import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminUser } from "../../api/admin";
import { adminKeys } from "../query-keys";

// Separate from useUpdateAdminUser(id): this one is for the Users LIST
// page, where the target id varies per row/click rather than being fixed
// for the component's lifetime.
export function useSetAdminUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateAdminUser(id, { isActive }),
    onSuccess: (res) => {
      queryClient.setQueryData(adminKeys.userDetail(res.user.id), res.user);
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "list"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.userStats });
    },
  });
}
