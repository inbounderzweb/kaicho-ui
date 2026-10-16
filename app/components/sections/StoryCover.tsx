"use client";

import { FormEvent, useState } from "react";
import Container from "../ui/Container";
import { IconCheck } from "../ui/icons";
import { submitBulkOrderInquiry } from "@/lib/api/inquiryPublic";
import { ApiError } from "@/lib/api/ApiError";
import { isValidIndianMobile, MOBILE_ERROR } from "@/lib/validation/phone";

const PURPOSES = ["Corporate Order", "Reselling", "Event / Function", "Restaurant / Catering", "Other"];

type FormState = {
  name: string;
  email: string;
  phone: string;
  quantity: string;
  purpose: string;
  message: string;
};

const INITIAL_STATE: FormState = {
  name: "",
  email: "",
  phone: "",
  quantity: "",
  purpose: "",
  message: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldClasses(hasError: boolean) {
  return `h-12 w-full rounded-lg border bg-white/10 px-4 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 ${
    hasError ? "border-red-300" : "border-white/25 focus:border-white/60"
  }`;
}

export default function StoryCover() {

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const update = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Please enter your name";
    if (!EMAIL_RE.test(form.email)) next.email = "Enter a valid email";
    if (!isValidIndianMobile(form.phone)) next.phone = MOBILE_ERROR;
    if (!form.quantity.trim() || Number(form.quantity) <= 0) next.quantity = "Enter quantity required";
    if (!form.purpose) next.purpose = "Select a purpose";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await submitBulkOrderInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        quantity: Number(form.quantity),
        purpose: form.purpose,
        message: form.message.trim() || undefined,
      });
      setSubmitted(true);
      setForm(INITIAL_STATE);
      setErrors({});
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong sending your inquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // bg-fixed pins the background to the viewport instead of the section,
    // so the page just scrolls normally over it (a plain parallax backdrop)
    // rather than the section itself pinning in place.
    <section
      id="b2b"
      className="relative flex w-full flex-col overflow-hidden bg-forest bg-[url('/mobile-coverimage.png')] bg-cover bg-center bg-fixed py-20 sm:py-24 md:bg-[url('/desktop-coverimage.png')]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-forest/70" />

      {/* bulk-order inquiry — same panel, transparent/glass fields over the fixed backdrop */}
      <Container fluid className="relative mt-2 pt-16 sm:mt-2 sm:pt-2">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-14">
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              <span className="text-white">Looking for</span>
              <br />
              <span className="text-brand-soft">Huge Quantity?</span>
            </h2>
            <p className="mt-4 text-sm font-semibold text-white/90">
              Planning a corporate order or need quantities above 10 packs?
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Share your requirement and our team will help you with the
              best bulk pricing.
            </p>
          </div>

          <div>
            {submitted ? (
              <div className="flex h-full min-h-70 flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-10 text-center backdrop-blur-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white">
                  <IconCheck className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-white">
                  Thank you! Your inquiry has been received.
                </h3>
                <p className="mt-2 max-w-sm text-sm text-white/70">
                  Our bulk-orders team will reach out on the contact details
                  you shared within one business day.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-sm font-semibold text-brand-soft hover:text-white"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Your Name*" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={update("name")}
                    placeholder="Enter Your Name"
                    className={fieldClasses(!!errors.name)}
                  />
                </Field>
                <Field label="Your Email*" error={errors.email}>
                  <input
                    value={form.email}
                    onChange={update("email")}
                    placeholder="Enter Your Email"
                    type="email"
                    className={fieldClasses(!!errors.email)}
                  />
                </Field>
                <Field label="Phone / WhatsApp Number*" error={errors.phone}>
                  <input
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="10-digit mobile number"
                    type="tel"
                    inputMode="tel"
                    className={fieldClasses(!!errors.phone)}
                  />
                </Field>
                <Field label="Quantity Required*" error={errors.quantity}>
                  <input
                    value={form.quantity}
                    onChange={update("quantity")}
                    placeholder="Eg. 50, 100, 500"
                    inputMode="numeric"
                    className={fieldClasses(!!errors.quantity)}
                  />
                </Field>
                <Field label="Purpose / Use Case*" error={errors.purpose} className="sm:col-span-2">
                  <select
                    value={form.purpose}
                    onChange={update("purpose")}
                    className={`${fieldClasses(!!errors.purpose)} appearance-none`}
                  >
                    <option value="" className="text-ink">
                      Select Purpose
                    </option>
                    {PURPOSES.map((p) => (
                      <option key={p} value={p} className="text-ink">
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Additional Message (Optional)" className="sm:col-span-2">
                  <textarea
                    value={form.message}
                    onChange={update("message")}
                    placeholder="Tell us more about your requirement"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </Field>

                {apiError && (
                  <p className="rounded-lg border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-100 sm:col-span-2">
                    {apiError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-12 rounded-lg bg-white text-sm font-bold uppercase tracking-wide text-forest transition-colors hover:bg-cream-deep disabled:opacity-60 sm:col-span-2"
                >
                  {submitting ? "Submitting…" : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-semibold text-white/90 ${className}`}>
      {label}
      {children}
      {error ? <span className="text-xs font-medium text-red-300">{error}</span> : null}
    </label>
  );
}
