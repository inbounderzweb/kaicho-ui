"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../ui/Button";
import PhoneStepForm from "./PhoneStepForm";
import OtpStepForm from "./OtpStepForm";
import NameStepForm from "./NameStepForm";
import {
  IconArrowRight,
  IconShieldCheck,
  IconLeaf,
  IconDropSlash,
  IconFlame,
  IconCheck,
} from "../ui/icons";
import { useAuthStore } from "@/lib/store/auth.store";
import { getSafeRedirectPath } from "@/lib/utils/safeRedirect";
import type { AuthUser } from "@/lib/api/auth";

const TRUST_BADGES = [
  { icon: IconLeaf, label: "100% Natural" },
  { icon: IconDropSlash, label: "No Preservatives" },
  { icon: IconFlame, label: "Ready to Eat" },
];

export default function LoginPageClient() {
  const step = useAuthStore((s) => s.step);
  const phone = useAuthStore((s) => s.phone);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  // Empty string (not the "/" default) here means "no safe redirect was
  // requested" so a bare /login visit still shows the normal success
  // screen instead of forcing a navigation to "/".
  const safeRedirectPath = redirect ? getSafeRedirectPath(redirect, "") : "";

  const [success, setSuccess] = useState(false);
  const setStep = useAuthStore((s) => s.setStep);
  const resetAuthFlow = useAuthStore((s) => s.reset);

  const handleVerified = (user: AuthUser) => {
    // Auth is done — clear the persisted phone/step/cooldown so a later
    // /login visit starts clean instead of on a stale OTP screen.
    resetAuthFlow();
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

  const handleOtpVerified = (user: AuthUser, requiresName: boolean) => {
    if (requiresName) {
      setStep("name");
      return;
    }
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
    <section className="relative flex min-h-[calc(100dvh-5rem-4rem)] items-stretch overflow-hidden bg-white sm:min-h-[calc(100dvh-5rem)]">
      {/* ─── Left Panel (desktop only) ─── */}
      <div className="relative hidden w-[60%] flex-col overflow-hidden lg:flex">
        <Image
          src="/desktop-coverimage.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" />
        <div className="absolute inset-0 bg-brand/10 mix-blend-multiply" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Image
                src="/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg"
                alt="Kaicho"
                width={24}
                height={24}
                className="h-6 w-6 brightness-0 invert"
              />
            </div>
            <span className="font-display text-lg font-bold text-white">Kaicho Foods</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 text-center">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Healthy meals,
            <br />
            delivered fresh.
          </h2>
          <p className="mt-3 max-w-[340px] text-sm leading-relaxed text-white/70">
            Ready-to-eat porridge and meals crafted with retort technology. No preservatives,
            just wholesome goodness.
          </p>
        </div>

        <div className="relative z-10 p-10">
          <div className="flex flex-wrap justify-center gap-3">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel / Form ─── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8 xl:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025] lg:hidden"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-forest) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative w-full max-w-[400px]">
          <div className="mb-8 text-center lg:mb-10">
            <div className="mx-auto mb-4 h-14 w-14 overflow-hidden rounded-2xl shadow-lg shadow-forest/20 lg:hidden">
              <Image
                src="/icon-512.png"
                alt="Kaicho"
                width={56}
                height={56}
                className="h-14 w-14 object-cover"
              />
            </div>
            <h1 className="font-display text-[26px] font-bold tracking-tight text-ink sm:text-3xl">
              {step === "phone" ? "Welcome back" : step === "otp" ? "Verify OTP" : "Welcome to Kaicho"}
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              {step === "phone"
                ? "Enter your mobile number to continue"
                : step === "otp"
                  ? `We sent a code to +91 ${phone}`
                  : "Tell us your name to finish setting up your account"}
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
            {step === "phone" ? (
              <PhoneStepForm onAuthenticated={handleOtpVerified} />
            ) : step === "otp" ? (
              <OtpStepForm onVerified={handleOtpVerified} />
            ) : (
              <NameStepForm onCompleted={handleVerified} />
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-faint">
            <IconShieldCheck className="h-3 w-3" />
            Secured with end-to-end encryption. We never share your number.
          </div>

          <div className="mt-6 flex justify-center gap-2 lg:hidden">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-cream/60 px-2.5 py-1 text-[10px] font-semibold text-ink-muted"
              >
                <Icon className="h-3 w-3" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
