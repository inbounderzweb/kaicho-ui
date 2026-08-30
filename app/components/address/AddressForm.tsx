"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressFormSchema, type AddressFormValues } from "@/lib/validation/address.schema";
import type { Address, AddressInput } from "@/lib/api/address";

// Shared by the checkout flow's AddressSelector (inline "add new address")
// and the profile page's address book (add + edit) — extracted rather than
// duplicated because both need identical validation, and a divergence
// between them would mean checkout accepting an address the address book
// rejects (or vice versa).

const inputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-faint";
const errorClass = "mt-1 text-xs font-semibold text-sale";

function toFormValues(address?: Address | null): AddressFormValues {
  return {
    label: address?.label ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    pincode: address?.pincode ?? "",
    isDefault: address?.isDefault ?? false,
  };
}

/** Strips the empty strings the form uses for "not filled in" back to
 *  `undefined`, so the API never stores a blank label/line2. */
export function toAddressInput(values: AddressFormValues): AddressInput {
  return {
    label: values.label?.trim() || undefined,
    line1: values.line1.trim(),
    line2: values.line2?.trim() || undefined,
    city: values.city.trim(),
    state: values.state.trim(),
    pincode: values.pincode.trim(),
    isDefault: values.isDefault,
  };
}

export default function AddressForm({
  address,
  submitLabel = "Save address",
  isSubmitting = false,
  errorMessage,
  onSubmit,
  onCancel,
}: {
  /** Pass an existing address to edit it; omit to add a new one. */
  address?: Address | null;
  submitLabel?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (input: AddressInput) => void;
  onCancel?: () => void;
}) {
  // Unique per instance so two forms on one page (e.g. an "add" form open
  // beneath an "edit" form) never collide on label/input ids.
  const fieldId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: toFormValues(address),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toAddressInput(values)))}
      className="space-y-3"
      noValidate
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${fieldId}-label`} className={labelClass}>
            Label
          </label>
          <input
            id={`${fieldId}-label`}
            {...register("label")}
            placeholder="Home, Work…"
            className={inputClass}
          />
          {errors.label && <p className={errorClass}>{errors.label.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${fieldId}-line1`} className={labelClass}>
            Address line 1 *
          </label>
          <input
            id={`${fieldId}-line1`}
            {...register("line1")}
            placeholder="Flat / house no., building, street"
            className={inputClass}
          />
          {errors.line1 && <p className={errorClass}>{errors.line1.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${fieldId}-line2`} className={labelClass}>
            Address line 2
          </label>
          <input
            id={`${fieldId}-line2`}
            {...register("line2")}
            placeholder="Area, landmark"
            className={inputClass}
          />
          {errors.line2 && <p className={errorClass}>{errors.line2.message}</p>}
        </div>

        <div>
          <label htmlFor={`${fieldId}-city`} className={labelClass}>
            City *
          </label>
          <input id={`${fieldId}-city`} {...register("city")} className={inputClass} />
          {errors.city && <p className={errorClass}>{errors.city.message}</p>}
        </div>

        <div>
          <label htmlFor={`${fieldId}-state`} className={labelClass}>
            State *
          </label>
          <input id={`${fieldId}-state`} {...register("state")} className={inputClass} />
          {errors.state && <p className={errorClass}>{errors.state.message}</p>}
        </div>

        <div>
          <label htmlFor={`${fieldId}-pincode`} className={labelClass}>
            Pincode *
          </label>
          <input
            id={`${fieldId}-pincode`}
            inputMode="numeric"
            maxLength={6}
            {...register("pincode")}
            className={inputClass}
          />
          {errors.pincode && <p className={errorClass}>{errors.pincode.message}</p>}
        </div>

        <div className="flex items-end pb-2.5">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" {...register("isDefault")} className="h-4 w-4 rounded accent-brand" />
            Set as default
          </label>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-xl bg-sale/10 p-3 text-xs font-semibold text-sale">{errorMessage}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
