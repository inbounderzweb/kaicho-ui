"use client";

import { useState } from "react";
import AddressForm from "../address/AddressForm";
import AddressLines from "../address/AddressLines";
import { useAddresses } from "@/lib/hooks/useAddresses";
import { useAddAddress } from "@/lib/hooks/useAddAddress";
import { useUpdateAddress } from "@/lib/hooks/useUpdateAddress";
import { useDeleteAddress } from "@/lib/hooks/useDeleteAddress";
import { useSetDefaultAddress } from "@/lib/hooks/useSetDefaultAddress";
import { ApiError } from "@/lib/api/ApiError";
import type { Address, AddressInput } from "@/lib/api/address";
import { IconMapPin } from "../ui/icons";

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function AddressesSection() {
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const addMutation = useAddAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const handleAdd = (input: AddressInput) => {
    addMutation.mutate(input, { onSuccess: () => setIsAdding(false) });
  };

  const handleUpdate = (addressId: string, patch: AddressInput) => {
    updateMutation.mutate({ addressId, patch }, { onSuccess: () => setEditingId(null) });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-cream" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-base font-semibold text-ink">Couldn&apos;t load your addresses</p>
        <p className="mt-1 text-sm text-ink-muted">
          This looks like a connection problem. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Try again
        </button>
      </div>
    );
  }

  const list: Address[] = addresses ?? [];

  return (
    <div className="space-y-4">
      {list.length === 0 && !isAdding && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <IconMapPin className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 text-base font-semibold text-ink">No saved addresses</p>
          <p className="mt-1 text-sm text-ink-muted">
            Add one so checkout is a single tap next time.
          </p>
        </div>
      )}

      {list.map((address) =>
        editingId === address.id ? (
          <div key={address.id} className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-ink">Edit address</h3>
            <AddressForm
              address={address}
              submitLabel="Save changes"
              isSubmitting={updateMutation.isPending}
              errorMessage={
                updateMutation.isError
                  ? messageOf(updateMutation.error, "Couldn't save this address. Please try again.")
                  : null
              }
              onSubmit={(patch) => handleUpdate(address.id, patch)}
              onCancel={() => {
                updateMutation.reset();
                setEditingId(null);
              }}
            />
          </div>
        ) : (
          <div
            key={address.id}
            className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <IconMapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-ink">{address.label || "Address"}</h3>
                {address.isDefault && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                    Default
                  </span>
                )}
              </div>
              <AddressLines address={address} className="mt-1" />

              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setRowError(null);
                    updateMutation.reset();
                    setEditingId(address.id);
                  }}
                  className="text-ink-muted transition-colors hover:text-brand"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    disabled={setDefaultMutation.isPending}
                    onClick={() => {
                      setRowError(null);
                      setDefaultMutation.mutate(address.id, {
                        onError: (err) =>
                          setRowError(messageOf(err, "Couldn't set this as your default address.")),
                      });
                    }}
                    className="text-ink-muted transition-colors hover:text-brand disabled:opacity-50"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    setRowError(null);
                    deleteMutation.mutate(address.id, {
                      onError: (err) =>
                        setRowError(messageOf(err, "Couldn't delete this address. Please try again.")),
                    });
                  }}
                  className="text-sale transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {rowError && (
        <p className="rounded-xl bg-sale/10 p-3 text-xs font-semibold text-sale">{rowError}</p>
      )}

      {isAdding ? (
        <div className="rounded-2xl border border-border bg-white p-5">
          <h3 className="mb-3 text-sm font-bold text-ink">New address</h3>
          <AddressForm
            isSubmitting={addMutation.isPending}
            errorMessage={
              addMutation.isError
                ? messageOf(addMutation.error, "Couldn't save this address. Please try again.")
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
          onClick={() => {
            addMutation.reset();
            setIsAdding(true);
          }}
          className="w-full rounded-2xl border border-dashed border-border py-4 text-sm font-semibold text-ink-muted transition-colors hover:border-brand hover:text-brand"
        >
          + Add new address
        </button>
      )}
    </div>
  );
}
