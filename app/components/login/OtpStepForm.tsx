"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import { IconChevronLeft, IconShieldCheck } from "../ui/icons";
import { useAuthStore } from "@/lib/store/auth.store";
import { useSendOtp } from "@/lib/hooks/useSendOtp";
import { useVerifyOtp } from "@/lib/hooks/useVerifyOtp";
import { otpFormSchema, type OtpFormValues } from "@/lib/validation/auth.schema";
import { ApiError } from "@/lib/api/ApiError";
import type { AuthUser } from "@/lib/api/auth";

export default function OtpStepForm({
  onVerified,
}: {
  onVerified: (user: AuthUser, requiresName: boolean) => void;
}) {
  const phone = useAuthStore((s) => s.phone);
  const resendAvailableAt = useAuthStore((s) => s.resendAvailableAt);
  const startResendCooldown = useAuthStore((s) => s.startResendCooldown);
  const reset = useAuthStore((s) => s.reset);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { control, handleSubmit, setValue } = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: "" },
  });

  const { field, fieldState } = useController({ name: "otp", control });

  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  // Deferred via setTimeout(…, 0) rather than called synchronously in the
  // effect body: keeps every setSecondsLeft/Date.now() call inside a timer
  // callback instead of the render/effect-execution path.
  useEffect(() => {
    if (!resendAvailableAt) {
      const id = setTimeout(() => setSecondsLeft(0), 0);
      return () => clearTimeout(id);
    }
    const update = () =>
      setSecondsLeft(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)));
    const initial = setTimeout(update, 0);
    const interval = setInterval(update, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [resendAvailableAt]);

  const onSubmit = (values: OtpFormValues) => {
    verifyOtp.mutate(
      { phone, otp: values.otp },
      { onSuccess: (data) => onVerified(data.user, data.requiresName) }
    );
  };

  const updateDigits = (next: string[]) => {
    setDigits(next);
    const joined = next.join("");
    field.onChange(joined);
    if (joined.length === 4 && next.every((d) => d !== "")) {
      handleSubmit(onSubmit)();
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    updateDigits(next);
    if (val && i < 3) {
      otpRefs.current[i + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      if (i < 4) next[i] = pasted[i];
    }
    updateDigits(next);
    const focusIndex = Math.min(pasted.length, 3);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleChangeNumber = () => {
    reset();
  };

  const handleResend = () => {
    sendOtp.mutate(phone, {
      onSuccess: () => startResendCooldown(45),
    });
    setDigits(["", "", "", ""]);
    setValue("otp", "");
    otpRefs.current[0]?.focus();
  };

  const errorMessage =
    fieldState.error?.message ??
    (verifyOtp.error instanceof ApiError ? verifyOtp.error.message : undefined) ??
    (sendOtp.error instanceof ApiError ? sendOtp.error.message : undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleChangeNumber}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-cream hover:text-ink"
          aria-label="Back"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          One-Time Password
        </span>
      </div>

      <div className="flex justify-between gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              otpRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            onPaste={handleOtpPaste}
            className="h-[52px] w-full max-w-[52px] rounded-xl border border-border bg-cream/50 text-center text-xl font-bold text-ink outline-none transition-all focus:border-forest focus:ring-[3px] focus:ring-forest/10 sm:h-14 sm:max-w-[56px]"
            autoFocus={i === 0}
          />
        ))}
      </div>

      {errorMessage && (
        <p className="animate-fade-up text-xs font-semibold text-sale">{errorMessage}</p>
      )}

      <Button type="submit" disabled={verifyOtp.isPending} size="lg" className="w-full">
        {verifyOtp.isPending ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Verifying…
          </span>
        ) : (
          <>
            Verify &amp; Login
            <IconShieldCheck className="h-4 w-4" />
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={handleChangeNumber}
        className="mx-auto block text-xs font-semibold text-forest transition-colors hover:text-brand-dark"
      >
        Change mobile number
      </button>

      <p className="text-center text-[11px] text-ink-faint">
        {secondsLeft > 0 ? (
          <>Resend OTP in 00:{secondsLeft.toString().padStart(2, "0")}</>
        ) : (
          <>
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              disabled={sendOtp.isPending}
              className="font-semibold text-forest hover:text-brand-dark disabled:opacity-50"
              onClick={handleResend}
            >
              Resend OTP
            </button>
          </>
        )}
      </p>
    </form>
  );
}
