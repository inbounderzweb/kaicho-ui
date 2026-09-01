"use client";

import { FormEvent, ReactNode, useState } from "react";
import Container from "../ui/Container";
import { IconCheck, IconMail, IconPhone, IconWhatsapp } from "../ui/icons";
import { submitContactInquiry } from "@/lib/api/inquiryPublic";
import { ApiError } from "@/lib/api/ApiError";
import { isValidIndianMobile, MOBILE_ERROR } from "@/lib/validation/phone";

const MESSAGE_MAX = 5000;

const CHANNELS = [
  {
    Icon: IconPhone,
    label: "Call us",
    value: "+91 87927 99631",
    href: "tel:+918792799631",
  },
  {
    Icon: IconMail,
    label: "Email us",
    value: "hello@kaicho.in",
    href: "mailto:hello@kaicho.in",
  },
  {
    Icon: IconWhatsapp,
    label: "WhatsApp",
    value: "Chat with us",
    href: "https://wa.me/918792799631",
  },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const INITIAL_STATE: FormState = { name: "", email: "", phone: "", message: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldClasses(hasError: boolean) {
  return `w-full rounded-lg border bg-cream/50 px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:ring-2 focus:ring-brand/15 ${
    hasError ? "border-sale" : "border-border focus:border-brand"
  }`;
}

export default function ContactSection() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Please enter your name";
    if (!EMAIL_RE.test(form.email)) next.email = "Enter a valid email";
    if (form.phone.trim() && !isValidIndianMobile(form.phone)) next.phone = MOBILE_ERROR;
    if (!form.message.trim()) next.message = "Please enter a message";
    else if (form.message.length > MESSAGE_MAX) next.message = "Message is too long";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await submitContactInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim(),
      });
      setSubmitted(true);
      setForm(INITIAL_STATE);
      setErrors({});
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong sending your message. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Get in Touch
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
              Questions about an order, our products, or a bulk inquiry? Reach out — we
              usually respond within one business day.
            </p>

            <div className="mt-8 space-y-3">
              {CHANNELS.map(({ Icon, label, value, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
                      {label}
                    </span>
                    <span className="block text-sm font-semibold text-ink">{value}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
            {submitted ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white">
                  <IconCheck className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">
                  Message sent!
                </h3>
                <p className="mt-2 max-w-sm text-sm text-ink-muted">
                  Thanks for reaching out — our team will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Your Name*" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={update("name")}
                    placeholder="Enter your name"
                    className={fieldClasses(!!errors.name)}
                  />
                </Field>
                <Field label="Your Email*" error={errors.email}>
                  <input
                    value={form.email}
                    onChange={update("email")}
                    type="email"
                    placeholder="Enter your email"
                    className={fieldClasses(!!errors.email)}
                  />
                </Field>
                <Field label="Phone (Optional)" error={errors.phone} className="sm:col-span-2">
                  <input
                    value={form.phone}
                    onChange={update("phone")}
                    type="tel"
                    inputMode="tel"
                    placeholder="10-digit mobile number"
                    className={fieldClasses(!!errors.phone)}
                  />
                </Field>
                <Field label="Message*" error={errors.message} className="sm:col-span-2">
                  <textarea
                    value={form.message}
                    onChange={update("message")}
                    rows={4}
                    maxLength={MESSAGE_MAX}
                    placeholder="How can we help?"
                    className={`${fieldClasses(!!errors.message)} resize-none`}
                  />
                </Field>

                {apiError && (
                  <p className="rounded-lg bg-sale/10 px-4 py-3 text-sm font-medium text-sale sm:col-span-2">
                    {apiError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-12 rounded-lg bg-brand text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:col-span-2"
                >
                  {submitting ? "Sending…" : "Send Message"}
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
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-semibold text-ink ${className}`}>
      {label}
      {children}
      {error ? <span className="text-xs font-medium text-sale">{error}</span> : null}
    </label>
  );
}
