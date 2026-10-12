"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import AuthField from "../auth/AuthField";
import GoogleAuthSection from "../auth/GoogleAuthSection";
import ResendVerification from "../auth/ResendVerification";
import { usePasswordLogin } from "@/lib/hooks/usePasswordLogin";
import { loginFormSchema, type LoginFormValues } from "@/lib/validation/auth.schema";
import { friendlyAuthError, isEmailNotVerifiedError, type AuthUser } from "@/lib/api/auth";

export default function EmailLoginForm({
  onAuthenticated,
}: {
  onAuthenticated: (user: AuthUser, requiresName: boolean, method: "password" | "google") => void;
}) {
  const login = usePasswordLogin();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, {
      onSuccess: (data) => onAuthenticated(data.user, data.requiresName, "password"),
    });
  };

  const unverified = isEmailNotVerifiedError(login.error);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <AuthField
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        autoFocus
        error={errors.email?.message}
        {...register("email")}
      />
      <AuthField
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="-mt-3 text-right">
        <Link href="/forgot-password" className="text-xs font-semibold text-forest hover:text-brand-dark">
          Forgot password?
        </Link>
      </div>

      {unverified ? (
        <div className="space-y-3 rounded-2xl border border-border bg-cream/50 p-4">
          <p role="alert" className="text-xs font-semibold text-ink">
            Please verify your email before logging in. Check your inbox for the verification link.
          </p>
          <ResendVerification email={getValues("email").trim().toLowerCase()} />
        </div>
      ) : (
        login.error && (
          <p role="alert" className="animate-fade-up text-xs font-semibold text-sale">
            {friendlyAuthError(login.error)}
          </p>
        )
      )}

      <div className="[&>button]:w-full">
      <Button type="submit" disabled={login.isPending} size="lg">
        {login.isPending ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Logging in…
          </span>
        ) : (
          "Login"
        )}
      </Button>
      </div>

      <GoogleAuthSection
        onAuthenticated={(user, requiresName) => onAuthenticated(user, requiresName, "google")}
      />

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
