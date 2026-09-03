import { useQuery } from "@tanstack/react-query";
import { fetchStoreSettings } from "../../api/settings";
import { settingsKeys } from "../query-keys";

export function useStoreSettings() {
  return useQuery({
    queryKey: settingsKeys.admin,
    queryFn: fetchStoreSettings,
    retry: false,
  });
}
