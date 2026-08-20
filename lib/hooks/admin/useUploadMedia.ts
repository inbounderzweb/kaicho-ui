import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadMedia } from "../../api/media";

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ files, onProgress }: { files: File[]; onProgress?: (percent: number) => void }) =>
      uploadMedia(files, onProgress),
    onSuccess: (result) => {
      if (result.data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["admin", "media", "list"] });
      }
    },
  });
}
