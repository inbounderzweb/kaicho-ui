import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInstagramPosts,
  fetchInstagramPost,
  createInstagramPost,
  updateInstagramPost,
  setInstagramPostStatus,
  deleteInstagramPost,
  type InstagramPostQueryParams,
  type InstagramPostFormPayload,
  type InstagramPostStatus,
} from "../../api/instagramPost";
import { instagramPostKeys } from "../query-keys";

export function useInstagramPostList(params: InstagramPostQueryParams = {}) {
  const { page = 1, pageSize = 20, search, status = "all" } = params;
  const normalized: InstagramPostQueryParams = { page, pageSize, search, status };

  return useQuery({
    queryKey: instagramPostKeys.list(normalized),
    queryFn: () => fetchInstagramPosts(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useInstagramPostDetail(id: string | null) {
  return useQuery({
    queryKey: instagramPostKeys.detail(id ?? "new"),
    queryFn: () => fetchInstagramPost(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin", "instagram-posts"] });
}

export function useCreateInstagramPost() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: InstagramPostFormPayload) => createInstagramPost(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateInstagramPost(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (patch: Partial<InstagramPostFormPayload>) => updateInstagramPost(id, patch),
    onSuccess: invalidate,
  });
}

export function useSetInstagramPostStatus(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (status: InstagramPostStatus) => setInstagramPostStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteInstagramPost() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteInstagramPost(id),
    onSuccess: invalidate,
  });
}
