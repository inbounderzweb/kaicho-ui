"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import AuthShell from "../auth/AuthShell";
import AuthField from "../auth/AuthField";
import GoogleAuthSection from "../auth/GoogleAuthSection";
import ResendVerification from "../auth/ResendVerification";
import NameStepForm from "../login/NameStepForm";
import { IconCheck } from "../ui/icons";
import { useRegister } from "@/lib/hooks/useRegister";
import { registerFormSchema, type RegisterFormValues } from "@/lib/validation/auth.schema";
import { friendlyAuthError, type AuthUser } from "@/lib/api/auth";
import { trackEvent } from "@/lib/analytics/events";

const RESEND_COOLDOWN_SECONDS = 60; // matches the backend default; the server enforces it regardless

export default function RegisterPageClient() {
  const router = useRouter();
  const registerAccount = useRegister();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [needsName, setNeedsName] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (values: RegisterFormValues) => {
    const email = values.email.trim().toLowerCase();
    registerAccount.mutate(
      { name: values.name.trim(), email, password: values.password },
      {
        onSuccess: () => {
          trackEvent("sign_up", { method: "email" });
          setRegisteredEmail(email);
        },
      }
    );
  };

  const goHome = (user: AuthUser) => {
    router.replace(user.role === "admin" ? "/admin" : "/");
  };

  const handleGoogle = (user: AuthUser, requiresName: boolean) => {
    if (requiresName) {
      setNeedsName(true);
      return;
    }
    trackEvent("login", { method: "google" });
    goHome(user);
  };

  if (registeredEmail) {
    return (
      <AuthShell
        title="Check your email"
        footer={
          <>
            Already verified?{" "}
            <Link href="/login" className="font-semibold text-forest hover:text-brand-dark">
              Log in
            </Link>
          </>
        }
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/25">
            <IconCheck className="h-7 w-7 text-white" strokeWidth={3} />
          </span>
          <p role="status" className="text-sm font-semibold text-ink">
            Account created. Please check your email and click the verification link to activate
            your account.
          </p>
          <p className="text-xs text-ink-muted">
            We sent it to <span className="font-semibold text-ink">{registeredEmail}</span>. The
            link expires in 30 minutes.
          </p>
          <div className="text-left">
            <ResendVerification email={registeredEmail} initialCooldown={RESEND_COOLDOWN_SECONDS} />
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={needsName ? "Welcome to Kaicho" : "Create your account"}
      subtitle={
        needsName
          ? "Tell us your name to finish setting up your account"
          : "Sign up with your email to start ordering"
      }
      footer={
        needsName ? undefined : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-forest hover:text-brand-dark">
              Log in
            </Link>
          </>
        )
      }
    >
      {needsName ? (
        <NameStepForm
          onCompleted={(user) => {
            trackEvent("sign_up", { method: "google" });
            goHome(user);
          }}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <AuthField
            id="reg-name"
            label="Full name"
            autoComplete="name"
            placeholder="e.g. Rahul Sharma"
            autoFocus
            error={errors.name?.message}
            {...register("name")}
          />
          <AuthField
            id="reg-email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <AuthField
            id="reg-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <p className="-mt-3 text-[11px] text-ink-faint">
            At least 8 characters, with a letter and a number.
          </p>
          <AuthField
            id="reg-confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {registerAccount.error && (
            <p role="alert" className="animate-fade-up text-xs font-semibold text-sale">
              {friendlyAuthError(registerAccount.error)}
            </p>
          )}

          <div className="[&>button]:w-full">
            <Button type="submit" disabled={registerAccount.isPending} size="lg">
            {registerAccount.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating account…
              </span>
            ) : (
              "Create Account"
            )}
            </Button>
          </div>

          <GoogleAuthSection onAuthenticated={handleGoogle} />

          <p className="text-center text-[11px] font-medium leading-relaxed text-ink-faint">
            By creating an account, you agree to our{" "}
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
      )}
    </AuthShell>
  );
}
