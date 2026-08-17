"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Button from "../components/ui/Button";
import {
  IconArrowRight,
  IconShieldCheck,
  IconLeaf,
  IconDropSlash,
  IconFlame,
  IconCheck,
  IconChevronLeft,
  IconGoogle,
} from "../components/ui/icons";

const TRUST_BADGES = [
  { icon: IconLeaf, label: "100% Natural" },
  { icon: IconDropSlash, label: "No Preservatives" },
  { icon: IconFlame, label: "Ready to Eat" },
];

export default function LoginPage() {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    setError("");
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep("otp");
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGoogleLoading(false);
    setSuccess(true);
  };

  const handleVerifyOtp = async () => {
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setError("");
    if (val && i < 5) {
      otpRefs.current[i + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      if (i < 6) next[i] = pasted[i];
    }
    setOtp(next);
    setError("");
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  useEffect(() => {
    if (step === "otp") {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  if (success) {
    return (
      <section className="relative flex min-h-[calc(100dvh-5rem-4rem)] items-center justify-center bg-brand-soft/30 px-4 py-12 sm:min-h-[calc(100dvh-5rem)] sm:px-6 lg:px-8">
        <div className="animate-fade-scale relative w-full max-w-[420px] text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/20">
            <IconCheck className="h-10 w-10 text-white" strokeWidth={2} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Welcome back!
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            You&apos;re now signed in to your Kaicho account.
          </p>
          <Button href="/" className="mt-8">
            Start Shopping
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-[calc(100dvh-5rem-4rem)] items-stretch overflow-hidden bg-white sm:min-h-[calc(100dvh-5rem)]">
      {/* ─── Left Panel (desktop only) ─── */}
      <div className="relative hidden w-[60%] flex-col overflow-hidden lg:flex">
        {/* Background image */}
        <Image
          src="/desktop-coverimage.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" />
        <div className="absolute inset-0 bg-brand/10 mix-blend-multiply" />

        {/* Top branding */}
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
            <span className="font-display text-lg font-bold text-white">
              Kaicho Foods
            </span>
          </div>
        </div>

        {/* Centered heading + paragraph */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 text-center">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Healthy meals,
            <br />
            delivered fresh.
          </h2>
          <p className="mt-3 max-w-[340px] text-sm leading-relaxed text-white/70">
            Ready-to-eat porridge and meals crafted with retort technology. No
            preservatives, just wholesome goodness.
          </p>
        </div>

        {/* Trust badges */}
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
        {/* Subtle mobile background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025] lg:hidden"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-forest) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative w-full max-w-[400px]">
          {/* Mobile header branding */}
          <div className="mb-8 text-center lg:mb-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest shadow-lg shadow-forest/20 lg:hidden">
              <Image
                src="/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg"
                alt="Kaicho"
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </div>
            <h1 className="font-display text-[26px] font-bold tracking-tight text-ink sm:text-3xl">
              {step === "mobile" ? "Welcome back" : "Verify OTP"}
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              {step === "mobile"
                ? "Enter your mobile number to continue"
                : `We sent a code to +91 ${mobile}`}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
            {step === "mobile" ? (
              <div className="space-y-5">
                {/* Mobile input */}
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
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendOtp();
                      }}
                      className="w-full bg-transparent px-4 py-3.5 text-base font-medium text-ink outline-none placeholder:text-ink-faint"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="animate-fade-up text-xs font-semibold text-sale">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleSendOtp}
                  disabled={loading}
                  size="sm"
                  className="w-full bg-[#00A961] rounded-lg py-2 text-white font-bold"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending OTP…
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </Button>

                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    Or
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-white py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-50"
                >
                  {googleLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60" />
                  ) : (
                    <IconGoogle className="h-4 w-4" />
                  )}
                  {googleLoading ? "Signing in…" : "Continue with Google"}
                </button>

                <p className="text-center text-[11px] font-medium leading-relaxed text-ink-faint">
                  By continuing, you agree to our Terms of Service and Privacy
                  Policy.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* OTP header with back */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("mobile");
                      setOtp(["", "", "", "", "", ""]);
                      setError("");
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-cream hover:text-ink"
                    aria-label="Back"
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    One-Time Password
                  </span>
                </div>

                {/* OTP inputs */}
                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
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

                {error && (
                  <p className="animate-fade-up text-xs font-semibold text-sale">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verifying…
                    </span>
                  ) : (
                    <>
                      Verify & Login
                      <IconShieldCheck className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("mobile");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                  }}
                  className="mx-auto block text-xs font-semibold text-forest transition-colors hover:text-brand-dark"
                >
                  Change mobile number
                </button>

                {/* Resend timer placeholder */}
                <p className="text-center text-[11px] text-ink-faint">
                  Didn&apos;t receive it?{" "}
                  <button
                    type="button"
                    className="font-semibold text-forest hover:text-brand-dark"
                    onClick={handleSendOtp}
                  >
                    Resend OTP
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Footer trust note */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-faint">
            <IconShieldCheck className="h-3 w-3" />
            Secured with end-to-end encryption. We never share your number.
          </div>

          {/* Mobile trust badges */}
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
