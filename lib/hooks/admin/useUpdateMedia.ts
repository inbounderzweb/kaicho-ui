import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMedia, type UpdateMediaInput } from "../../api/media";
import { mediaKeys } from "../query-keys";

export function useUpdateMedia(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdateMediaInput) => updateMedia(id, patch),
    onSuccess: (res) => {
      queryClient.setQueryData(mediaKeys.detail(id), res);
      queryClient.invalidateQueries({ queryKey: ["admin", "media", "list"] });
    },
  });
}
