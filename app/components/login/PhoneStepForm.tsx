"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import GoogleSignInButton, { GOOGLE_SIGN_IN_ENABLED } from "./GoogleSignInButton";
import { useAuthStore } from "@/lib/store/auth.store";
import { useSendOtp } from "@/lib/hooks/useSendOtp";
import { useGoogleLogin } from "@/lib/hooks/useGoogleLogin";
import { phoneFormSchema, type PhoneFormValues } from "@/lib/validation/auth.schema";
import { ApiError } from "@/lib/api/ApiError";
import type { AuthUser } from "@/lib/api/auth";

export default function PhoneStepForm({
  onAuthenticated,
}: {
  /** Called when Google sign-in completes — same signature the OTP step uses. */
  onAuthenticated: (user: AuthUser, requiresName: boolean) => void;
}) {
  const setPhone = useAuthStore((s) => s.setPhone);
  const setStep = useAuthStore((s) => s.setStep);
  const startResendCooldown = useAuthStore((s) => s.startResendCooldown);
  const sendOtp = useSendOtp();
  const googleLogin = useGoogleLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { mobile: "" },
  });

  const onSubmit = (values: PhoneFormValues) => {
    sendOtp.mutate(values.mobile, {
      onSuccess: () => {
        setPhone(values.mobile);
        startResendCooldown(45);
        setStep("otp");
      },
    });
  };

  const handleGoogleCredential = (credential: string) => {
    googleLogin.mutate(credential, {
      onSuccess: (data) => onAuthenticated(data.user, data.requiresName),
    });
  };

  const googleStatus = googleLogin.isPending
    ? "Signing you in…"
    : googleLogin.error instanceof ApiError
      ? googleLogin.error.message
      : undefined;

  const errorMessage =
    errors.mobile?.message ??
    (sendOtp.error instanceof ApiError ? sendOtp.error.message : undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label
          htmlFor="mobile"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted"
        >
          Mobile Number
        </label>
        <div className="flex overflow-hidden rounded-2xl border border-border bg-cream/50 transition-all focus-within:border-forest focus-within:ring-[3px] focus-within:ring-forest/10">
          <span className="flex select-none items-center border-r border-border bg-cream/80 px-4 text-sm font-semibold text-ink-muted">
            +91
          </span>
          <input
            id="mobile"
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

      <Button
        type="submit"
        disabled={sendOtp.isPending}
        size="sm"
        className="w-full bg-[#00A961] rounded-lg py-2 text-white font-bold"
      >
        {sendOtp.isPending ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Sending OTP…
          </span>
        ) : (
          "Send OTP"
        )}
      </Button>

      {GOOGLE_SIGN_IN_ENABLED && (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignInButton
            onCredential={handleGoogleCredential}
            disabled={googleLogin.isPending}
            statusText={googleStatus}
          />
        </>
      )}

      <p className="text-center text-[11px] font-medium leading-relaxed text-ink-faint">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="font-semibold text-forest hover:text-brand-dark">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="font-semibold text-forest hover:text-brand-dark">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
