"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../ui/Button";
import AuthShell, { TRUST_BADGES } from "../auth/AuthShell";
import EmailLoginForm from "./EmailLoginForm";
import NameStepForm from "./NameStepForm";
import { IconArrowRight, IconCheck } from "../ui/icons";
import { getSafeRedirectPath } from "@/lib/utils/safeRedirect";
import { trackEvent } from "@/lib/analytics/events";
import type { AuthUser } from "@/lib/api/auth";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  // Empty string (not the "/" default) here means "no safe redirect was
  // requested" so a bare /login visit still shows the normal success
  // screen instead of forcing a navigation to "/".
  const safeRedirectPath = redirect ? getSafeRedirectPath(redirect, "") : "";

  const [success, setSuccess] = useState(false);
  // Only a Google account whose profile had no name lands here; email
  // sign-ups always supply one.
  const [needsName, setNeedsName] = useState(false);

  const handleVerified = (user: AuthUser) => {
    if (safeRedirectPath) {
      // An explicit ?redirect= (e.g. bounced here from a protected page)
      // wins over role-based routing — validated by getSafeRedirectPath to
      // be an internal "/..." path.
      router.replace(safeRedirectPath as Parameters<typeof router.replace>[0]);
      return;
    }
    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }
    setSuccess(true);
  };

  const handleAuthenticated = (
    user: AuthUser,
    requiresName: boolean,
    method: "password" | "google"
  ) => {
    if (requiresName) {
      // Not a completed sign-up yet — that fires once NameStepForm submits.
      setNeedsName(true);
      return;
    }
    trackEvent("login", { method });
    handleVerified(user);
  };

  const handleNameCompleted = (user: AuthUser) => {
    trackEvent("sign_up", { method: "google" });
    handleVerified(user);
  };

  if (success) {
    return (
      <section className="relative flex min-h-[calc(100dvh-5rem-4rem)] items-center justify-center bg-brand-soft/30 px-4 py-12 sm:min-h-[calc(100dvh-5rem)] sm:px-6 lg:px-8">
        <div className="animate-fade-scale relative w-full max-w-[420px] text-center">
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-brand/15" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/25">
              <IconCheck className="h-10 w-10 text-white" strokeWidth={3} />
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Welcome back!
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            You&apos;re now signed in to your Kaicho account.
          </p>
          <Button href="/products" className="mt-8">
            Start Shopping
            <IconArrowRight className="h-4 w-4" />
          </Button>

          <div className="mt-8 flex justify-center gap-2">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold text-ink-muted"
              >
                <Icon className="h-3 w-3" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <AuthShell
      title={needsName ? "Welcome to Kaicho" : "Welcome back"}
      subtitle={
        needsName
          ? "Tell us your name to finish setting up your account"
          : "Log in to your account to continue"
      }
      footer={
        needsName ? undefined : (
          <>
            New to Kaicho?{" "}
            <Link
              href="/register"
              className="font-semibold text-forest hover:text-brand-dark"
            >
              Create an account
            </Link>
          </>
        )
      }
    >
      {needsName ? (
        <NameStepForm onCompleted={handleNameCompleted} />
      ) : (
        <EmailLoginForm onAuthenticated={handleAuthenticated} />
      )}
    </AuthShell>
  );
}
