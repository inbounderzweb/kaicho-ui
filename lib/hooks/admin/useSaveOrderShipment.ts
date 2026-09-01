import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveAdminOrderShipment, type SaveShipmentInput } from "../../api/admin";
import { adminKeys } from "../query-keys";

// Create-or-update the shipment. The backend also nudges the order status
// forward along the fulfilment path, so the order list and dashboard are
// invalidated too. The detail query is refetched (not just patched) because
// the shipment endpoint returns the plain order DTO, without the admin-only
// `customer` / `allowedNextStatuses` the detail view also needs.
export function useSaveOrderShipment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveShipmentInput) => saveAdminOrderShipment(id, input),
    onSuccess: (order) => {
      queryClient.setQueryData(adminKeys.orderDetail(id), order);
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(id) });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", "list"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}
