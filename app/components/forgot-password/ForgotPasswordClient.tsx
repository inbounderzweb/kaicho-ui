"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import AuthShell from "../auth/AuthShell";
import AuthField from "../auth/AuthField";
import { IconCheck } from "../ui/icons";
import { useForgotPassword } from "@/lib/hooks/useForgotPassword";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validation/auth.schema";
import { friendlyAuthError } from "@/lib/api/auth";

const BACK_TO_LOGIN = (
  <Link href="/login" className="font-semibold text-forest hover:text-brand-dark">
    Back to login
  </Link>
);

export default function ForgotPasswordClient() {
  const forgot = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const send = (email: string) => {
    forgot.mutate(email, {
      onSuccess: (data) => {
        setSentTo(email);
        setSecondsLeft(data.resendAfter);
      },
    });
  };

  const onSubmit = (values: ForgotPasswordFormValues) => send(values.email.trim().toLowerCase());

  if (sentTo) {
    const disabled = forgot.isPending || secondsLeft > 0;
    return (
      <AuthShell title="Check your email" footer={BACK_TO_LOGIN}>
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/25">
            <IconCheck className="h-7 w-7 text-white" strokeWidth={3} />
          </span>
          <p role="status" className="text-sm font-semibold text-ink">
            If an account exists for{" "}
            <span className="break-all">{sentTo}</span>, we&apos;ve sent a link to reset your
            password.
          </p>
          <p className="text-xs text-ink-muted">
            The link expires in 30 minutes. Don&apos;t see it? Check your spam folder.
          </p>
          {forgot.error && (
            <p role="alert" className="text-xs font-semibold text-sale">
              {friendlyAuthError(forgot.error)}
            </p>
          )}
          <div className="[&>button]:w-full">
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => send(sentTo)}>
              {forgot.isPending
                ? "Sending…"
                : secondsLeft > 0
                  ? `Resend available in ${secondsLeft}s`
                  : "Resend email"}
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={BACK_TO_LOGIN}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthField
          id="forgot-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          error={errors.email?.message}
          {...register("email")}
        />

        {forgot.error && (
          <p role="alert" className="animate-fade-up text-xs font-semibold text-sale">
            {friendlyAuthError(forgot.error)}
          </p>
        )}

        <div className="[&>button]:w-full">
          <Button type="submit" disabled={forgot.isPending} size="lg">
            {forgot.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sending…
              </span>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
