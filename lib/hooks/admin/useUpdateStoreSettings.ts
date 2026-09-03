import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStoreSettings, type StoreSettingsFormInput } from "../../api/settings";
import { settingsKeys } from "../query-keys";

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<StoreSettingsFormInput>) => updateStoreSettings(patch),
    onSuccess: (res) => {
      queryClient.setQueryData(settingsKeys.admin, res);
      // The storefront reads the same numbers from /settings — drop its
      // cache so the cart nudge reflects the change on next view.
      queryClient.invalidateQueries({ queryKey: settingsKeys.public });
    },
  });
}
