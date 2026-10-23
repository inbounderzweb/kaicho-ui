import type { Address } from "../api/address";

// Mirror of kaicho-be/src/modules/address/addressCompleteness.ts. The server is
// the authority (checkout refuses an incomplete address); this lets the page
// say what is missing before the customer pays.

const text = (value: string | null | undefined) => (value ?? "").trim();

/** Human-readable names of the missing or invalid fields (empty = complete). */
export function findAddressProblems(address: Partial<Address>): string[] {
  const problems: string[] = [];
  if (text(address.receiverName).length < 2) problems.push("receiver name");
  if (!/^[6-9]\d{9}$/.test(text(address.receiverPhone).replace(/\D/g, ""))) problems.push("a valid mobile number");
  if (!text(address.houseNo)) problems.push("house / flat number");
  if (text(address.area).length < 3) problems.push("street / area");
  if (text(address.city).length < 2) problems.push("city");
  if (text(address.state).length < 2) problems.push("state");
  if (!/^[1-9][0-9]{5}$/.test(text(address.pincode))) problems.push("a valid 6-digit pincode");
  return problems;
}
