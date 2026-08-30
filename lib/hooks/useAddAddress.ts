import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAddress, type Address, type AddressInput } from "../api/address";
import { addressKeys } from "./query-keys";

// Every address mutation invalidates the whole list rather than patching
// the cache: creating/updating an address with isDefault:true also clears
// the flag on whichever address held it before, so the only reliably
// correct post-mutation state is the server's own list.
export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddressInput): Promise<Address> => createAddress(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
