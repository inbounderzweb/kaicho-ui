import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMedia } from "../../api/media";

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media", "list"] });
    },
  });
}
