import type { Address } from "../api/address";
import { findAddressProblems } from "./completeness";

export type AddressProblemKind = "loading" | "load-failed" | "none-saved" | "none-selected" | "incomplete" | "not-served";

export interface AddressProblem {
  kind: AddressProblemKind;
  message: string;
}

/**
 * Is the address the customer is about to pay for usable? Having saved
 * addresses is not enough: one must be selected, complete, and inside the
 * delivery areas. Returns null when Pay Now may proceed.
 */
export function checkoutAddressProblem({
  addresses,
  isLoading,
  isError,
  selectedId,
  isServed,
  notServedMessage,
}: {
  addresses: Address[] | undefined;
  isLoading: boolean;
  isError: boolean;
  selectedId: string | null;
  isServed: (state: string) => boolean;
  notServedMessage: (state: string) => string;
}): AddressProblem | null {
  if (isLoading) return { kind: "loading", message: "Your addresses are still loading. Please try again in a moment." };
  if (isError) return { kind: "load-failed", message: "We couldn't load your saved addresses. Please try again." };
  if (!addresses || addresses.length === 0) {
    return { kind: "none-saved", message: "Please add your delivery address to continue with payment." };
  }
  const selected = selectedId ? addresses.find((a) => a.id === selectedId) : undefined;
  if (!selected) {
    return { kind: "none-selected", message: "Please select a delivery address to continue with payment." };
  }
  const missing = findAddressProblems(selected);
  if (missing.length > 0) {
    return {
      kind: "incomplete",
      message: `This address is missing ${missing.join(", ")}. Please edit it in your profile or choose another address.`,
    };
  }
  if (!isServed(selected.state)) {
    return { kind: "not-served", message: `${notServedMessage(selected.state)} Please choose an address in an area we deliver to.` };
  }
  return null;
}
