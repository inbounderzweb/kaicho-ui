"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressFormSchema, type AddressFormValues } from "@/lib/validation/address.schema";
import type { Address, AddressInput } from "@/lib/api/address";
import { getCurrentPosition } from "@/lib/location/geolocation";
import { reverseGeocode, searchLocations } from "@/lib/location/locationApi";
import { LocationServiceError } from "@/lib/location/errorMessages";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { IconMapPin } from "../ui/icons";

const PIN_RE = /^[1-9]\d{5}$/;

// Shared by the checkout flow's AddressSelector (inline "add new address")
// and the profile page's address book (add + edit) — extracted rather than
// duplicated because both need identical validation, and a divergence
// between them would mean checkout accepting an address the address book
// rejects (or vice versa).

const inputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-faint";
const errorClass = "mt-1 text-xs font-semibold text-sale";

interface ReceiverDefaults {
  receiverName?: string;
  receiverPhone?: string;
}

function toFormValues(address?: Address | null, fallback?: ReceiverDefaults): AddressFormValues {
  return {
    label: address?.label ?? "",
    // On "add", pre-fill the receiver from the signed-in account; the user
    // can override per address (gifting, family, office reception…).
    receiverName: address?.receiverName ?? fallback?.receiverName ?? "",
    receiverPhone: address?.receiverPhone ?? fallback?.receiverPhone ?? "",
    houseNo: address?.houseNo ?? "",
    building: address?.building ?? "",
    area: address?.area ?? "",
    landmark: address?.landmark ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    pincode: address?.pincode ?? "",
    isDefault: address?.isDefault ?? false,
  };
}

/** Strips the empty strings the form uses for "not filled in" back to
 *  `undefined`, so the API never stores a blank label/building/landmark. */
export function toAddressInput(values: AddressFormValues): AddressInput {
  return {
    label: values.label?.trim() || undefined,
    receiverName: values.receiverName.trim(),
    receiverPhone: values.receiverPhone.trim(),
    houseNo: values.houseNo.trim(),
    building: values.building?.trim() || undefined,
    area: values.area.trim(),
    landmark: values.landmark?.trim() || undefined,
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
  const { data: user } = useCurrentUser();

  const receiverDefaults: ReceiverDefaults = {
    receiverName: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || undefined,
    receiverPhone: user?.phone || undefined,
  };

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: toFormValues(address, receiverDefaults),
  });

  // The account may still be loading when the form first renders (add mode);
  // backfill the receiver fields once it arrives, without clobbering typing.
  const seededReceiver = useRef(Boolean(address) || Boolean(receiverDefaults.receiverName));
  useEffect(() => {
    if (seededReceiver.current || address) return;
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
    if (!name && !user?.phone) return;
    seededReceiver.current = true;
    if (name && !getValues("receiverName").trim()) {
      setValue("receiverName", name, { shouldValidate: true });
    }
    if (user?.phone && !getValues("receiverPhone").trim()) {
      setValue("receiverPhone", user.phone, { shouldValidate: true });
    }
  }, [user, address, getValues, setValue]);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoNote, setGeoNote] = useState<{ error: boolean; text: string } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinNote, setPinNote] = useState<{ error: boolean; text: string } | null>(null);

  // The pincode we last resolved city/state from — seeded with the address
  // being edited so an untouched pincode never triggers a lookup (and never
  // overwrites a manually-corrected city/state on an existing address).
  const resolvedPinRef = useRef(address?.pincode ?? "");

  const pincodeValue = useWatch({ control, name: "pincode" });
  const debouncedPin = useDebouncedValue((pincodeValue ?? "").trim(), 500);

  // Pincode -> city + state. Fires only when the pincode is a complete,
  // valid 6-digit code that differs from the last one we resolved.
  useEffect(() => {
    const pin = debouncedPin;
    if (!PIN_RE.test(pin) || pin === resolvedPinRef.current) return;

    let cancelled = false;
    setPinLoading(true);
    setPinNote(null);

    searchLocations(pin)
      .then((results) => {
        if (cancelled) return;
        const hit = results.find((r) => r.city || r.state) ?? results[0];
        if (!hit || (!hit.city && !hit.state)) {
          setPinNote({ error: true, text: "Couldn't match that pincode — enter city and state yourself." });
          return;
        }
        resolvedPinRef.current = pin;
        if (hit.city) setValue("city", hit.city, { shouldValidate: true, shouldDirty: true });
        if (hit.state) setValue("state", hit.state, { shouldValidate: true, shouldDirty: true });
        setPinNote({
          error: false,
          text: `${[hit.city, hit.state].filter(Boolean).join(", ")} — filled from pincode`,
        });
      })
      .catch(() => {
        if (!cancelled) setPinNote({ error: true, text: "Couldn't look up that pincode right now." });
      })
      .finally(() => {
        if (!cancelled) setPinLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedPin, setValue]);

  const handleUseLocation = async () => {
    setGeoLoading(true);
    setGeoNote(null);
    try {
      const { latitude, longitude } = await getCurrentPosition();
      const loc = await reverseGeocode(latitude, longitude);

      // The geocoder can name the street/area but never the house number —
      // fill "area" (only if the user hasn't already typed one) and leave
      // house / building / landmark for them.
      const area = loc.address || loc.locality;
      if (area && !(getValues("area") ?? "").trim()) {
        setValue("area", area, { shouldValidate: true, shouldDirty: true });
      }
      if (loc.city) setValue("city", loc.city, { shouldValidate: true, shouldDirty: true });
      if (loc.state) setValue("state", loc.state, { shouldValidate: true, shouldDirty: true });
      if (loc.postalCode && PIN_RE.test(loc.postalCode)) {
        // Keep the pincode effect from re-resolving what we just filled.
        resolvedPinRef.current = loc.postalCode;
        setValue("pincode", loc.postalCode, { shouldValidate: true, shouldDirty: true });
      }
      setPinNote(null);
      setGeoNote({
        error: false,
        text: `Detected ${loc.displayName}. Add your house / flat number above.`,
      });
    } catch (err) {
      const text =
        err instanceof LocationServiceError
          ? err.detail.message
          : "Couldn't get your location. Enter the address manually.";
      setGeoNote({ error: true, text });
    } finally {
      setGeoLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toAddressInput(values)))}
      className="space-y-3"
      noValidate
    >
      <div>
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={geoLoading}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/5 disabled:opacity-50"
        >
          {geoLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
          ) : (
            <IconMapPin className="h-4 w-4" />
          )}
          {geoLoading ? "Detecting your location…" : "Use my current location"}
        </button>
        {geoNote && (
          <p className={`mt-1.5 text-xs font-semibold ${geoNote.error ? "text-sale" : "text-brand"}`}>
            {geoNote.text}
          </p>
        )}
        <p className="mt-1.5 text-xs text-ink-faint">
          Or enter your pincode below and we&apos;ll fill in the city and state.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${fieldId}-receiverName`} className={labelClass}>
            Receiver name *
          </label>
          <input
            id={`${fieldId}-receiverName`}
            {...register("receiverName")}
            placeholder="Who receives this order"
            className={inputClass}
          />
          {errors.receiverName && <p className={errorClass}>{errors.receiverName.message}</p>}
        </div>

        <div>
          <label htmlFor={`${fieldId}-receiverPhone`} className={labelClass}>
            Receiver mobile number *
          </label>
          <input
            id={`${fieldId}-receiverPhone`}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile"
            {...register("receiverPhone", {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, "");
              },
            })}
            className={inputClass}
          />
          {errors.receiverPhone && <p className={errorClass}>{errors.receiverPhone.message}</p>}
        </div>

        <div>
          <label htmlFor={`${fieldId}-houseNo`} className={labelClass}>
            House / flat no. *
          </label>
          <input
            id={`${fieldId}-houseNo`}
            {...register("houseNo")}
            placeholder="e.g. 12B"
            className={inputClass}
          />
          {errors.houseNo && <p className={errorClass}>{errors.houseNo.message}</p>}
        </div>

        <div>
          <label htmlFor={`${fieldId}-building`} className={labelClass}>
            Building / block / society
          </label>
          <input
            id={`${fieldId}-building`}
            {...register("building")}
            placeholder="Optional"
            className={inputClass}
          />
          {errors.building && <p className={errorClass}>{errors.building.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${fieldId}-area`} className={labelClass}>
            Street / area / locality *
          </label>
          <input
            id={`${fieldId}-area`}
            {...register("area")}
            placeholder="Street name, area, locality"
            className={inputClass}
          />
          {errors.area && <p className={errorClass}>{errors.area.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${fieldId}-landmark`} className={labelClass}>
            Landmark
          </label>
          <input
            id={`${fieldId}-landmark`}
            {...register("landmark")}
            placeholder="Nearby landmark (optional)"
            className={inputClass}
          />
          {errors.landmark && <p className={errorClass}>{errors.landmark.message}</p>}
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
          {!errors.pincode && pinLoading && (
            <p className="mt-1 text-xs font-semibold text-ink-faint">Looking up pincode…</p>
          )}
          {!errors.pincode && !pinLoading && pinNote && (
            <p className={`mt-1 text-xs font-semibold ${pinNote.error ? "text-sale" : "text-brand"}`}>
              {pinNote.text}
            </p>
          )}
        </div>

        <div>
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

        <div className="flex items-end pb-2.5 sm:col-span-2">
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
