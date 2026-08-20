import { useQuery } from "@tanstack/react-query";
import { fetchMediaDetail } from "../../api/media";
import { mediaKeys } from "../query-keys";

export function useMediaDetail(id: string | null) {
  return useQuery({
    queryKey: mediaKeys.detail(id ?? ""),
    queryFn: () => fetchMediaDetail(id!),
    enabled: Boolean(id),
    retry: false,
  });
}
