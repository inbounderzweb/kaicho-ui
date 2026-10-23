"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import AddressForm from "../address/AddressForm";
import AddressLines from "../address/AddressLines";
import { useAddresses } from "@/lib/hooks/useAddresses";
import { useAddAddress } from "@/lib/hooks/useAddAddress";
import { ApiError } from "@/lib/api/ApiError";
import type { AddressInput } from "@/lib/api/address";
import { IconMapPin } from "../ui/icons";

/** Lets the checkout page pull the customer's attention to this section. */
export interface AddressSelectorHandle {
  /** Scroll here, open the add form if nothing is saved, and focus the first field. */
  requireAttention: () => void;
}

const AddressSelector = forwardRef<AddressSelectorHandle, {
  selectedId: string | null;
  onSelect: (addressId: string) => void;
  /** Shown highlighted at the top of the section while an address is required. */
  attentionMessage?: string | null;
  /** Called after a NEW address was saved and selected (so checkout can return to Pay Now). */
  onAdded?: () => void;
}>(function AddressSelector({ selectedId, onSelect, attentionMessage = null, onAdded }, ref) {
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const addMutation = useAddAddress();
  const [isAdding, setIsAdding] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      requireAttention() {
        const section = sectionRef.current;
        if (!section) return;
        section.scrollIntoView({ behavior: "smooth", block: "center" });
        const noneSaved = !isLoading && !isError && (!addresses || addresses.length === 0);
        if (noneSaved) setIsAdding(true);
        // Wait for the scroll and (when opened) the form to render, then focus
        // the first relevant control without jumping the page again.
        setTimeout(() => {
          const target =
            section.querySelector<HTMLElement>("form input:not([type=hidden]):not([disabled])") ??
            section.querySelector<HTMLElement>("input[type=radio]:checked") ??
            section.querySelector<HTMLElement>("input[type=radio]") ??
            section.querySelector<HTMLElement>("button");
          target?.focus({ preventScroll: true });
        }, 400);
      },
    }),
    [addresses, isLoading, isError]
  );

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
        onAdded?.();
      },
    });
  };

  return (
    <section
      ref={sectionRef}
      id="delivery-address"
      tabIndex={-1}
      aria-labelledby="delivery-address-title"
      className={`scroll-mt-24 rounded-2xl border bg-white p-5 outline-none transition-shadow sm:p-6 ${
        attentionMessage ? "border-sale ring-2 ring-sale/30" : "border-border"
      }`}
    >
      <h2 id="delivery-address-title" className="font-display text-lg font-bold text-ink">
        Delivery address
      </h2>
      {attentionMessage && (
        <p role="alert" className="mt-3 rounded-xl bg-sale/10 px-3 py-2.5 text-sm font-semibold text-sale">
          {attentionMessage}
        </p>
      )}

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
});

export default AddressSelector;

