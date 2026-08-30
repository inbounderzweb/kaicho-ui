"use client";

import type { PaymentMethod } from "@/lib/api/order";

const METHODS: { id: PaymentMethod; title: string; description: string }[] = [
  {
    id: "RAZORPAY",
    title: "Pay online",
    description: "UPI, cards, net banking & wallets via Razorpay.",
  },
  {
    id: "COD",
    title: "Cash on delivery",
    description: "Pay in cash when your order arrives.",
  },
];

export default function PaymentMethodSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-ink">Payment method</h2>

      <div className="mt-4 space-y-3">
        {METHODS.map((method) => {
          const isSelected = method.id === value;
          return (
            <label
              key={method.id}
              className={`flex gap-3 rounded-xl border p-4 transition-colors ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              } ${isSelected ? "border-brand bg-brand-soft/40" : "border-border hover:border-brand/50"}`}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChange(method.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-brand"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{method.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{method.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
