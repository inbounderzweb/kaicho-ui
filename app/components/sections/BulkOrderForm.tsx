"use client";

import { FormEvent, useState } from "react";
import Container from "../Container";
import { IconCheck } from "../icons";

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
const PHONE_RE = /^[0-9+\s-]{7,15}$/;

function fieldClasses(hasError: boolean) {
  return `h-12 w-full rounded-lg border bg-white px-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/40 ${
    hasError ? "border-sale" : "border-ink/10 focus:border-brand"
  }`;
}

export default function BulkOrderForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Please enter your name";
    if (!EMAIL_RE.test(form.email)) next.email = "Enter a valid email";
    if (!PHONE_RE.test(form.phone)) next.phone = "Enter a valid phone number";
    if (!form.quantity.trim() || Number(form.quantity) <= 0) next.quantity = "Enter quantity required";
    if (!form.purpose) next.purpose = "Select a purpose";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    setForm(INITIAL_STATE);
  };

  return (
    <section id="b2b" className="py-20 sm:py-24">
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-brand-soft">
          <div className="grid grid-cols-1 gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-14">
            <div>
              <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
                <span className="text-ink">Looking for</span>
                <br />
                <span className="text-brand">Huge Quantity?</span>
              </h2>
              <p className="mt-4 text-sm font-semibold text-ink">
                Planning a corporate order or need quantities above 10 packs?
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Share your requirement and our team will help you with the
                best bulk pricing.
              </p>
            </div>

            <div>
              {submitted ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl bg-white px-6 py-10 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <IconCheck className="h-7 w-7" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-ink">
                    Thank you! Your inquiry has been received.
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-ink-muted">
                    Our bulk-orders team will reach out on the contact details
                    you shared within one business day.
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
                      placeholder="Enter Your Phone Number"
                      type="tel"
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
                      <option value="">Select Purpose</option>
                      {PURPOSES.map((p) => (
                        <option key={p} value={p}>
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
                      className="w-full resize-none rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </Field>

                  <button
                    type="submit"
                    className="mt-2 h-12 rounded-lg bg-brand text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark sm:col-span-2"
                  >
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
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
    <label className={`flex flex-col gap-1.5 text-sm font-semibold text-ink ${className}`}>
      {label}
      {children}
      {error ? <span className="text-xs font-medium text-sale">{error}</span> : null}
    </label>
  );
}
