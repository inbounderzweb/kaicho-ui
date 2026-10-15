import type { ReactNode } from "react";

// Logo-style cards for the accepted payment methods. Drawn as inline SVG so
// there are no extra requests and they stay sharp at any size. These are
// simplified renditions — swap in the official brand artwork if you have it.
const CARD_CLASS = "h-8 w-[52px] shrink-0 rounded-md border border-ink/10 bg-white";

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 52 32" role="img" aria-label={label} className={CARD_CLASS}>
      <title>{label}</title>
      {children}
    </svg>
  );
}

function Visa() {
  return (
    <Card label="Visa">
      <text
        x="26"
        y="21.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="0.3"
        fill="#1A1F71"
      >
        VISA
      </text>
    </Card>
  );
}

function Mastercard() {
  return (
    <Card label="Mastercard">
      <defs>
        <clipPath id="mc-left">
          <circle cx="20.5" cy="16" r="8.5" />
        </clipPath>
      </defs>
      <circle cx="20.5" cy="16" r="8.5" fill="#EB001B" />
      <circle cx="31.5" cy="16" r="8.5" fill="#F79E1B" />
      <circle cx="31.5" cy="16" r="8.5" fill="#FF5F00" clipPath="url(#mc-left)" />
    </Card>
  );
}

function Upi() {
  return (
    <Card label="UPI">
      <text
        x="20"
        y="21"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="13"
        fontWeight="900"
        fontStyle="italic"
        fill="#3D3D3D"
      >
        UPI
      </text>
      <path d="M36 7 L43 16 L36 25 L33.5 25 L40.5 16 L33.5 7 Z" fill="#F37021" />
      <path d="M40 7 L47 16 L40 25 L37.5 25 L44.5 16 L37.5 7 Z" fill="#097939" />
    </Card>
  );
}

function RuPay() {
  return (
    <Card label="RuPay">
      <text
        x="23"
        y="20.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="11.5"
        fontWeight="800"
        fontStyle="italic"
      >
        <tspan fill="#1B4B93">Ru</tspan>
        <tspan fill="#F37021">Pay</tspan>
      </text>
      <path d="M43 9 L48 16 L43 23 Z" fill="#097939" />
    </Card>
  );
}

export default function PaymentBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Upi />
      <Visa />
      <Mastercard />
      <RuPay />
    </div>
  );
}
