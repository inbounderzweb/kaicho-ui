import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchMediaList, type MediaQueryParams } from "../../api/media";
import { mediaKeys } from "../query-keys";

export function useMediaList(params: MediaQueryParams = {}) {
  const {
    page = 1,
    pageSize = 24,
    search,
    status = "all",
    mediaType = "all",
    sort = "createdAt",
    order = "desc",
  } = params;

  const normalized: MediaQueryParams = { page, pageSize, search, status, mediaType, sort, order };

  return useQuery({
    queryKey: mediaKeys.list(normalized),
    queryFn: () => fetchMediaList(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
