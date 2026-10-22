import { describe, expect, it } from "vitest";
import { canEmailCustomer, orderStatusAfterShipment, shipmentChangeEmails, statusChangeEmails } from "../orderEmail";

describe("order email prompt rules", () => {
  it("prompts for customer-visible milestones only", () => {
    expect(statusChangeEmails("CONFIRMED", "PROCESSING")).toBe(true);
    expect(statusChangeEmails("CONFIRMED", "CANCELLED")).toBe(true);
    expect(statusChangeEmails("DELIVERED", "RETURN_REQUESTED")).toBe(false);
    expect(statusChangeEmails("PROCESSING", "PROCESSING")).toBe(false);
  });

  it("a shipment update advances the order forward only", () => {
    expect(orderStatusAfterShipment("CONFIRMED", "SHIPPED")).toBe("SHIPPED");
    expect(orderStatusAfterShipment("SHIPPED", "PACKED")).toBe("SHIPPED");
    expect(orderStatusAfterShipment("PROCESSING", "FAILED_DELIVERY")).toBe("PROCESSING");
    expect(orderStatusAfterShipment("CANCELLED", "SHIPPED")).toBe("CANCELLED");
  });

  it("does not prompt when a shipment edit leaves the order status unchanged", () => {
    expect(shipmentChangeEmails("SHIPPED", "IN_TRANSIT")).toBe(false);
    expect(shipmentChangeEmails("SHIPPED", "DELIVERED")).toBe(true);
    expect(shipmentChangeEmails("PROCESSING", "SHIPPED")).toBe(true);
  });

  it("only a verified address can be emailed", () => {
    expect(canEmailCustomer({ email: "a@b.com", emailVerified: true })).toBe(true);
    expect(canEmailCustomer({ email: "a@b.com", emailVerified: false })).toBe(false);
    expect(canEmailCustomer({ email: null, emailVerified: true })).toBe(false);
    expect(canEmailCustomer(null)).toBe(false);
  });
});
