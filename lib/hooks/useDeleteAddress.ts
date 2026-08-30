import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAddress } from "../api/address";
import { addressKeys } from "./query-keys";

// Deleting an address never rewrites order history — orders snapshot the
// shipping address at placement time (see Order.shippingAddress), so this
// only affects the address book and future checkouts.
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
