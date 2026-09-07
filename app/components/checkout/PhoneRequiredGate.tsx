"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import { useUpdatePhone } from "@/lib/hooks/useUpdatePhone";
import { phoneFormSchema, type PhoneFormValues } from "@/lib/validation/auth.schema";
import { ApiError } from "@/lib/api/ApiError";
import { IconShieldCheck } from "../ui/icons";

/**
 * Shown on /checkout when the signed-in account has no mobile number
 * (Google sign-in accounts start without one). Saving it updates `auth/me`,
 * which clears this gate and reveals the normal checkout. The backend
 * (checkout.service) enforces the same rule regardless of this UI.
 */
export default function PhoneRequiredGate() {
  const updatePhone = useUpdatePhone();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { mobile: "" },
  });

  const onSubmit = (values: PhoneFormValues) => {
    updatePhone.mutate(values.mobile);
  };

  const errorMessage =
    errors.mobile?.message ??
    (updatePhone.error instanceof ApiError ? updatePhone.error.message : undefined);

  return (
    <div className="mt-8 flex justify-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">Add your mobile number</h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          We need a mobile number for delivery updates and to reach you about this order.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
          <div>
            <label
              htmlFor="checkout-mobile"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Mobile Number
            </label>
            <div className="flex overflow-hidden rounded-2xl border border-border bg-cream/50 transition-all focus-within:border-forest focus-within:ring-[3px] focus-within:ring-forest/10">
              <span className="flex select-none items-center border-r border-border bg-cream/80 px-4 text-sm font-semibold text-ink-muted">
                +91
              </span>
              <input
                id="checkout-mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                className="w-full bg-transparent px-4 py-3.5 text-base font-medium text-ink outline-none placeholder:text-ink-faint"
                autoFocus
                {...register("mobile", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "");
                  },
                })}
              />
            </div>
          </div>

          {errorMessage && (
            <p className="animate-fade-up text-xs font-semibold text-sale">{errorMessage}</p>
          )}

          <Button type="submit" disabled={updatePhone.isPending} size="lg" className="w-full">
            {updatePhone.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </span>
            ) : (
              "Save & Continue"
            )}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-faint">
            <IconShieldCheck className="h-3 w-3" />
            We never share your number.
          </p>
        </form>
      </div>
    </div>
  );
}
