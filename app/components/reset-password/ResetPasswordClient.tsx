"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import AuthShell from "../auth/AuthShell";
import AuthField from "../auth/AuthField";
import { IconCheck } from "../ui/icons";
import { useResetPassword } from "@/lib/hooks/useResetPassword";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/lib/validation/auth.schema";
import { friendlyAuthError } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/ApiError";

const REDIRECT_DELAY_MS = 2000;

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Captured once, then stripped from the URL so the one-time token doesn't
  // linger in the address bar / history (same approach as /verify-email).
  const [token] = useState(() => searchParams.get("token"));
  const reset = useResetPassword();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (token) window.history.replaceState(null, "", "/reset-password");
  }, [token]);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => router.replace("/login"), REDIRECT_DELAY_MS);
    return () => clearTimeout(id);
  }, [done, router]);

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) return;
    reset.mutate({ token, password: values.password }, { onSuccess: () => setDone(true) });
  };

  // The backend uses 400 for a bad/expired link but also for a weak password;
  // the weak-password case is caught client-side first, so a 400 here means
  // the link itself is dead.
  const linkDead = !token || (reset.error instanceof ApiError && reset.error.status === 400);

  if (linkDead) {
    return (
      <AuthShell
        title="Link expired"
        footer={
          <Link href="/login" className="font-semibold text-forest hover:text-brand-dark">
            Back to login
          </Link>
        }
      >
        <div className="space-y-5 text-center">
          <p role="alert" className="text-sm font-semibold text-sale">
            Reset link is invalid or expired.
          </p>
          <div className="[&>a]:w-full">
            <Link
              href="/forgot-password"
              className="inline-flex w-full items-center justify-center rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated">
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/25">
            <IconCheck className="h-7 w-7 text-white" strokeWidth={3} />
          </span>
          <p role="status" className="text-sm font-semibold text-ink">
            Your password has been reset. You&apos;ve been signed out everywhere.
          </p>
          <p className="text-xs text-ink-muted">Taking you to login…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthField
          id="reset-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          autoFocus
          error={errors.password?.message}
          {...register("password")}
        />
        <p className="-mt-3 text-[11px] text-ink-faint">
          At least 8 characters, with a letter and a number.
        </p>
        <AuthField
          id="reset-confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {reset.error && (
          <p role="alert" className="animate-fade-up text-xs font-semibold text-sale">
            {friendlyAuthError(reset.error)}
          </p>
        )}

        <div className="[&>button]:w-full">
          <Button type="submit" disabled={reset.isPending} size="lg">
            {reset.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Updating…
              </span>
            ) : (
              "Reset Password"
            )}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
