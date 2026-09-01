import { describe, it, expect } from "vitest";
import {
  shipmentProgress,
  SHIPMENT_STATUSES,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_TIMELINE_STEPS,
  type OrderShipmentHistoryEntry,
} from "../order";

const hist = (...statuses: OrderShipmentHistoryEntry["status"][]): OrderShipmentHistoryEntry[] =>
  statuses.map((status, i) => ({ status, at: `2026-09-0${i + 1}T00:00:00.000Z` }));

describe("shipmentProgress", () => {
  it("reports the current step for an in-flight shipment", () => {
    expect(shipmentProgress({ status: "ORDER_CONFIRMED", history: [] })).toEqual({
      stepIndex: 0,
      state: "in_progress",
    });
    expect(shipmentProgress({ status: "SHIPPED", history: [] })).toEqual({
      stepIndex: 3,
      state: "in_progress",
    });
  });

  it("marks the final step as delivered", () => {
    expect(shipmentProgress({ status: "DELIVERED", history: [] })).toEqual({
      stepIndex: SHIPMENT_TIMELINE_STEPS.length - 1,
      state: "delivered",
    });
  });

  it("treats CANCELLED / FAILED_DELIVERY as exceptions anchored to the last on-path step", () => {
    expect(
      shipmentProgress({
        status: "FAILED_DELIVERY",
        history: hist("SHIPPED", "OUT_FOR_DELIVERY", "FAILED_DELIVERY"),
      })
    ).toEqual({ stepIndex: SHIPMENT_TIMELINE_STEPS.indexOf("OUT_FOR_DELIVERY"), state: "exception" });

    expect(shipmentProgress({ status: "CANCELLED", history: [] })).toEqual({
      stepIndex: -1,
      state: "exception",
    });
  });
});

describe("shipment status constants", () => {
  it("has a label for every status and a 7-step happy-path timeline", () => {
    expect(SHIPMENT_TIMELINE_STEPS).toHaveLength(7);
    for (const status of SHIPMENT_STATUSES) {
      expect(SHIPMENT_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
