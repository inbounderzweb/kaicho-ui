import { describe, it, expect } from "vitest";
import { checkoutAddressProblem } from "../checkoutAddress";
import type { Address } from "../../api/address";

const good: Address = {
  id: "a1",
  receiverName: "Asha Rao",
  receiverPhone: "9876543210",
  houseNo: "12",
  area: "MG Road",
  city: "Kochi",
  state: "Kerala",
  pincode: "682001",
};
const served = () => true;
const base = { addresses: [good], isLoading: false, isError: false, selectedId: "a1", isServed: served, notServedMessage: (s: string) => `We don't deliver to ${s}.` };

describe("checkout address validation (Pay Now)", () => {
  it("passes for a selected, complete, served address", () => {
    expect(checkoutAddressProblem(base)).toBeNull();
  });

  it("no saved address → ask the customer to add one", () => {
    expect(checkoutAddressProblem({ ...base, addresses: [], selectedId: null })).toMatchObject({
      kind: "none-saved",
      message: "Please add your delivery address to continue with payment.",
    });
    expect(checkoutAddressProblem({ ...base, addresses: undefined, selectedId: null })?.kind).toBe("none-saved");
  });

  it("saved addresses but none selected (or a stale selection) is not 'ready'", () => {
    expect(checkoutAddressProblem({ ...base, selectedId: null })?.kind).toBe("none-selected");
    expect(checkoutAddressProblem({ ...base, selectedId: "deleted-id" })?.kind).toBe("none-selected");
  });

  it("an incomplete selected address is reported with what is missing", () => {
    const legacy: Address = { id: "a2", city: "Kochi", state: "Kerala", pincode: "682001" };
    const r = checkoutAddressProblem({ ...base, addresses: [legacy], selectedId: "a2" });
    expect(r?.kind).toBe("incomplete");
    expect(r?.message).toContain("receiver name");
    expect(r?.message).toContain("street / area");
  });

  it("an invalid pincode is incomplete", () => {
    expect(checkoutAddressProblem({ ...base, addresses: [{ ...good, pincode: "123" }] })?.kind).toBe("incomplete");
  });

  it("an address outside the delivery areas is not served", () => {
    const r = checkoutAddressProblem({ ...base, isServed: () => false });
    expect(r?.kind).toBe("not-served");
    expect(r?.message).toContain("We don't deliver to Kerala.");
  });

  it("loading and failed loads are distinct from 'no address'", () => {
    expect(checkoutAddressProblem({ ...base, isLoading: true, addresses: undefined })?.kind).toBe("loading");
    expect(checkoutAddressProblem({ ...base, isError: true, addresses: undefined })?.kind).toBe("load-failed");
  });
});
