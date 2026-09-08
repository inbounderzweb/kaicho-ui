import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchYouTubeVideos,
  fetchYouTubeVideo,
  createYouTubeVideo,
  updateYouTubeVideo,
  setYouTubeVideoStatus,
  deleteYouTubeVideo,
  type YouTubeVideoQueryParams,
  type YouTubeVideoFormPayload,
  type YouTubeVideoStatus,
} from "../../api/youtubeVideo";
import { youtubeVideoKeys } from "../query-keys";

export function useYouTubeVideoList(params: YouTubeVideoQueryParams = {}) {
  const { page = 1, pageSize = 20, search, status = "all" } = params;
  const normalized: YouTubeVideoQueryParams = { page, pageSize, search, status };

  return useQuery({
    queryKey: youtubeVideoKeys.list(normalized),
    queryFn: () => fetchYouTubeVideos(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useYouTubeVideoDetail(id: string | null) {
  return useQuery({
    queryKey: youtubeVideoKeys.detail(id ?? "new"),
    queryFn: () => fetchYouTubeVideo(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin", "youtube-videos"] });
}

export function useCreateYouTubeVideo() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: YouTubeVideoFormPayload) => createYouTubeVideo(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateYouTubeVideo(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (patch: Partial<YouTubeVideoFormPayload>) => updateYouTubeVideo(id, patch),
    onSuccess: invalidate,
  });
}

export function useSetYouTubeVideoStatus(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (status: YouTubeVideoStatus) => setYouTubeVideoStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteYouTubeVideo() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteYouTubeVideo(id),
    onSuccess: invalidate,
  });
}
