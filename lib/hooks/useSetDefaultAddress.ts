import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setDefaultAddress } from "../api/address";
import { addressKeys } from "./query-keys";

// Promoting one address to default demotes whichever one held the flag, so
// the response body (single address or list, depending on the backend) is
// intentionally ignored — the list is refetched instead of being patched
// from a partial response.
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => setDefaultAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
