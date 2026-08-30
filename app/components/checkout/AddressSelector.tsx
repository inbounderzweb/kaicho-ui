"use client";

import { useState } from "react";
import AddressForm from "../address/AddressForm";
import AddressLines from "../address/AddressLines";
import { useAddresses } from "@/lib/hooks/useAddresses";
import { useAddAddress } from "@/lib/hooks/useAddAddress";
import { ApiError } from "@/lib/api/ApiError";
import type { AddressInput } from "@/lib/api/address";
import { IconMapPin } from "../ui/icons";

export default function AddressSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (addressId: string) => void;
}) {
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const addMutation = useAddAddress();
  const [isAdding, setIsAdding] = useState(false);

  // Default-address preselection is owned by the parent (CheckoutClient),
  // which derives it into `selectedId` alongside the checkout validation
  // that depends on the same value — this component just renders whatever
  // address that canonical value points to as selected.

  const handleAdd = (input: AddressInput) => {
    addMutation.mutate(input, {
      onSuccess: (created) => {
        setIsAdding(false);
        // A freshly added address is almost always the one being shipped to.
        onSelect(created.id);
      },
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-ink">Delivery address</h2>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-cream" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center">
          <p className="text-sm font-semibold text-ink">Couldn&apos;t load your addresses.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {addresses && addresses.length > 0 ? (
            <div className="mt-4 space-y-3">
              {addresses.map((address) => {
                const isSelected = address.id === selectedId;
                return (
                  <label
                    key={address.id}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                      isSelected ? "border-brand bg-brand-soft/40" : "border-border hover:border-brand/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping-address"
                      value={address.id}
                      checked={isSelected}
                      onChange={() => onSelect(address.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-brand"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ink">{address.label || "Address"}</span>
                        {address.isDefault && (
                          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                            Default
                          </span>
                        )}
                      </div>
                      <AddressLines address={address} className="mt-1" />
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            !isAdding && (
              <div className="mt-4 rounded-xl border border-dashed border-border py-10 text-center">
                <IconMapPin className="mx-auto h-8 w-8 text-ink-faint" />
                <p className="mt-3 text-sm font-semibold text-ink">No saved addresses yet</p>
                <p className="mt-1 text-sm text-ink-muted">Add one to continue with your order.</p>
              </div>
            )
          )}

          {isAdding ? (
            <div className="mt-4 rounded-xl border border-border p-4">
              <h3 className="mb-3 text-sm font-bold text-ink">New address</h3>
              <AddressForm
                submitLabel="Save & use this address"
                isSubmitting={addMutation.isPending}
                errorMessage={
                  addMutation.error instanceof ApiError
                    ? addMutation.error.message
                    : addMutation.isError
                      ? "Couldn't save this address. Please try again."
                      : null
                }
                onSubmit={handleAdd}
                onCancel={() => {
                  addMutation.reset();
                  setIsAdding(false);
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-4 w-full rounded-xl border border-dashed border-border py-3 text-sm font-semibold text-ink-muted transition-colors hover:border-brand hover:text-brand"
            >
              + Add new address
            </button>
          )}
        </>
      )}
    </section>
  );
}
