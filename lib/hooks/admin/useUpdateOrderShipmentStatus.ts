import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminOrderShipmentStatus } from "../../api/admin";
import type { ShipmentStatus } from "../../api/order";
import { adminKeys } from "../query-keys";

// Quick status-only update once a shipment exists. The backend appends the
// shipment history entry and advances the order status along the fulfilment
// path where the new shipment status implies it.
export function useUpdateOrderShipmentStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { status: ShipmentStatus; note?: string }) =>
      updateAdminOrderShipmentStatus(id, input),
    onSuccess: (order) => {
      queryClient.setQueryData(adminKeys.orderDetail(id), order);
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(id) });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", "list"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}
