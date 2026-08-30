import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAddress, type Address, type AddressInput } from "../api/address";
import { addressKeys } from "./query-keys";

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      addressId,
      patch,
    }: {
      addressId: string;
      patch: Partial<AddressInput>;
    }): Promise<Address> => updateAddress(addressId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
