import { apiFetch } from "./client";

// Backed by kaicho-be's /api/addresses (requireAuth), which CRUDs the
// existing User.addresses subdocument array rather than a separate
// collection. Deliberately NOT the same shape as lib/api/admin.ts's
// AdminUserAddress (that one is the admin read-only projection, with
// non-optional nulls); this is the customer-facing shape the address book
// and checkout both write against.
export interface Address {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface AddressInput {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

// address.service.ts's AddressDto (every /addresses response, list or
// single) names the id field `addressId`, not `id` — it's a subdocument id
// within the User document, not a standalone resource. Every consumer here
// (checkout's AddressSelector, the profile AddressesSection) is written
// against `.id`, so this is the one place that reshapes the wire DTO into
// the frontend's Address, rather than every call site guessing which key
// name applies.
interface AddressDto {
  addressId: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

function fromDto({ addressId, ...rest }: AddressDto): Address {
  return { id: addressId, ...rest };
}

// The backend wraps single-entity responses in a named key (matching the
// rest of the codebase's product/brand/order controllers — see
// address.controller.ts), not a bare value, so every call here unwraps one
// level beyond apiFetch's own {success,data} unwrapping.
export async function fetchAddresses(): Promise<Address[]> {
  const { items } = await apiFetch<{ items: AddressDto[]; total: number }>("/addresses", { method: "GET" });
  return items.map(fromDto);
}

export async function createAddress(input: AddressInput): Promise<Address> {
  const { address } = await apiFetch<{ address: AddressDto }>("/addresses", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return fromDto(address);
}

export async function updateAddress(addressId: string, patch: Partial<AddressInput>): Promise<Address> {
  const { address } = await apiFetch<{ address: AddressDto }>(`/addresses/${encodeURIComponent(addressId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return fromDto(address);
}

export function deleteAddress(addressId: string): Promise<void> {
  return apiFetch<void>(`/addresses/${encodeURIComponent(addressId)}`, { method: "DELETE" });
}

// The backend may answer with either the single updated address or the
// whole re-ordered list (only one address can be default, so setting one
// clears another). The hooks refetch the list after any mutation instead
// of writing the response into the cache, so this response body is
// deliberately typed as unknown-ish and never trusted as the new list.
export function setDefaultAddress(addressId: string): Promise<unknown> {
  return apiFetch<unknown>(`/addresses/${encodeURIComponent(addressId)}/default`, { method: "PATCH" });
}
