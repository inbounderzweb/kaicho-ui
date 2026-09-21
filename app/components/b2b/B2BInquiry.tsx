"use client";

import { FormEvent, useState } from "react";
import { FiFileText, FiLock } from "react-icons/fi";
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
  return `h-12 min-w-0 w-full rounded-lg border bg-white px-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/20 ${
    hasError ? "border-red-500" : "border-border focus:border-brand"
  }`;
}

export default function B2BInquiry() {
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
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email";
    if (!isValidIndianMobile(form.phone)) next.phone = MOBILE_ERROR;
    if (!/^\d+$/.test(form.quantity.trim()) || !Number.isSafeInteger(Number(form.quantity)) || Number(form.quantity) <= 0) next.quantity = "Enter quantity required";
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
    <div className="min-w-0 rounded-2xl border border-brand/10 bg-white p-5 shadow-card sm:p-8">
      <h3 className="mb-6 flex items-center gap-3 font-display text-xl font-semibold"><FiFileText aria-hidden="true" className="shrink-0 text-brand" /> Submit Your Inquiry</h3>
            {submitted ? (
              <div role="status" className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-border bg-brand-soft px-6 py-10 text-center backdrop-blur-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-ink">
                  <IconCheck className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink">
                  Thank you! Your inquiry has been received.
                </h3>
                <p className="mt-2 max-w-sm text-sm text-ink-muted">
                  Our bulk-orders team will reach out on the contact details
                  you shared to discuss your requirements.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Your Name*" error={errors.name} errorId="b2b-name-error">
                  <input
                    aria-label="Your Name*"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "b2b-name-error" : undefined}
                    autoComplete="name"
                    value={form.name}
                    onChange={update("name")}
                    placeholder="Enter Your Name"
                    className={fieldClasses(!!errors.name)}
                  />
                </Field>
                <Field label="Your Email*" error={errors.email} errorId="b2b-email-error">
                  <input
                    aria-label="Your Email*"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "b2b-email-error" : undefined}
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="Enter Your Email"
                    type="email"
                    className={fieldClasses(!!errors.email)}
                  />
                </Field>
                <Field label="Phone / WhatsApp Number*" error={errors.phone} errorId="b2b-phone-error">
                  <input
                    aria-label="Phone / WhatsApp Number*"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "b2b-phone-error" : undefined}
                    autoComplete="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="10-digit mobile number"
                    type="tel"
                    inputMode="tel"
                    className={fieldClasses(!!errors.phone)}
                  />
                </Field>
                <Field label="Quantity Required*" error={errors.quantity} errorId="b2b-quantity-error">
                  <input
                    aria-label="Quantity Required*"
                    aria-invalid={!!errors.quantity}
                    aria-describedby={errors.quantity ? "b2b-quantity-error" : undefined}
                    autoComplete="off"
                    value={form.quantity}
                    onChange={update("quantity")}
                    placeholder="Eg. 50, 100, 500"
                    inputMode="numeric"
                    className={fieldClasses(!!errors.quantity)}
                  />
                </Field>
                <Field label="Purpose / Use Case*" error={errors.purpose} errorId="b2b-purpose-error" >
                  <select
                    aria-label="Purpose / Use Case*"
                    aria-invalid={!!errors.purpose}
                    aria-describedby={errors.purpose ? "b2b-purpose-error" : undefined}
                    autoComplete="off"
                    value={form.purpose}
                    onChange={update("purpose")}
                    className={`${fieldClasses(!!errors.purpose)}` }
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
                <Field label="Additional Message (Optional)" >
                  <textarea
                    value={form.message}
                    onChange={update("message")}
                    placeholder="Tell us more about your requirement"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border bg-brand-soft px-4 py-3 text-sm text-ink placeholder:text-ink-faint backdrop-blur-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </Field>

                {apiError && (
                  <p role="alert" className="rounded-lg border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">
                    {apiError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-12 rounded-lg bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:col-span-2"
                >
                  {submitting ? "Submitting…" : "Submit Inquiry"}
                </button>
              </form>
            )}
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-ink-muted"><FiLock aria-hidden="true" className="shrink-0" /> Your information is safe with us. We respect your privacy.</p>
    </div>
  );
}

function Field({
  label,
  error,
  errorId,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  errorId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-ink ${className}`}>
      {label}
      {children}
      {error ? <span id={errorId} role="alert" className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
