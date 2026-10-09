"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import AuthField from "./AuthField";
import { useResendVerification } from "@/lib/hooks/useResendVerification";
import { resendFormSchema, type ResendFormValues } from "@/lib/validation/auth.schema";
import { friendlyAuthError } from "@/lib/api/auth";

/**
 * "Resend verification email". The server's answer is identical whether or
 * not the address has an account, so the confirmation here is deliberately
 * non-committal. `initialCooldown` is for callers that just sent an email
 * themselves (registration) so the button starts disabled.
 */
export default function ResendVerification({
  email,
  initialCooldown = 0,
}: {
  /** When known, the form is hidden and this address is used. */
  email?: string;
  initialCooldown?: number;
}) {
  const resend = useResendVerification();
  const [secondsLeft, setSecondsLeft] = useState(initialCooldown);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendFormValues>({
    resolver: zodResolver(resendFormSchema),
    defaultValues: { email: email ?? "" },
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const send = (address: string) => {
    resend.mutate(address, {
      onSuccess: (data) => {
        setSecondsLeft(data.resendAfter);
        setConfirmation("If the account exists and is not verified, a verification email has been sent.");
      },
      onError: () => setConfirmation(null),
    });
  };

  const onSubmit = (values: ResendFormValues) => send(values.email);
  const disabled = resend.isPending || secondsLeft > 0;
  const label = resend.isPending
    ? "Sending…"
    : secondsLeft > 0
      ? `Resend available in ${secondsLeft}s`
      : "Resend verification email";

  const error = friendlyAuthError(resend.error);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      {!email && (
        <AuthField
          id="resend-email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
      )}

      {confirmation && (
        <p role="status" className="text-xs font-semibold text-forest">
          {confirmation}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs font-semibold text-sale">
          {error}
        </p>
      )}

      <div className="[&>button]:w-full">
        <Button
          type={email ? "button" : "submit"}
          onClick={email ? () => send(email) : undefined}
          disabled={disabled}
          variant="outline"
          size="sm"
        >
          {label}
        </Button>
      </div>
    </form>
  );
}
