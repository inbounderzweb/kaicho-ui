import { IconMail, IconMessageCircle, IconPhone, IconWhatsapp } from "../ui/icons";

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

export default function CustomerSupportSection() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
          <IconMessageCircle className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-base font-bold text-ink">Need help?</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Our support team is here for order, delivery and product questions.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {CHANNELS.map(({ Icon, label, value, href }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand"
          >
            <Icon className="h-5 w-5 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {label}
              </p>
              <p className="truncate text-sm font-semibold text-ink">{value}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
