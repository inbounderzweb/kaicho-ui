import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import { NAV_LINKS } from "./nav-links";
import {
  IconFacebook,
  IconInstagram,
  IconMail,
  IconMapPin,
  IconPhone,
  IconWhatsapp,
} from "./icons";

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Shipping Policy", href: "#" },
  { label: "Refund Policy", href: "#" },
];

const PAYMENT_METHODS = ["UPI", "Visa", "Mastercard", "RuPay", "COD"];

export default function Footer() {
  return (
    <footer id="contact" className="mt-8">
      <div className="bg-brand-soft">
        <Container className="grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg"
              alt="Kaicho Foods"
              width={140}
              height={44}
              className="h-10 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              Ready-to-eat, gut-healthy meals made with Japanese retort
              technology &mdash; said, served, and shared across India.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <SocialLink href="https://instagram.com" label="Instagram">
                <IconInstagram className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="https://facebook.com" label="Facebook">
                <IconFacebook className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="https://wa.me/918792799631" label="WhatsApp">
                <IconWhatsapp className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-ink-muted transition-colors hover:text-brand"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
              Contact Us
            </h3>
            <ul className="mt-4 space-y-4 text-sm text-ink-muted">
              <li className="flex gap-3">
                <IconMapPin className="h-5 w-5 shrink-0 text-brand" />
                <span>
                  Kaicho Foods, No.EKP.8/293, Kayapoyil, Kakkara PO, Via MM
                  Bazar, Kannur, Kerala &ndash; 670306, India.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <IconMail className="h-5 w-5 shrink-0 text-brand" />
                <a href="mailto:hello@kaicho.in" className="hover:text-brand">
                  hello@kaicho.in
                </a>
              </li>
              <li className="flex items-center gap-3">
                <IconPhone className="h-5 w-5 shrink-0 text-brand" />
                <a href="tel:+918792799631" className="hover:text-brand">
                  +91 87927 99631
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
              Trust &amp; Payments
            </h3>
            <p className="mt-4 text-sm text-ink-muted">
              FSSAI Licensed &middot; LIC No: 21325250000413
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink-muted"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </div>

      <div className="border-t border-border bg-white">
        <Container className="flex flex-col items-center gap-3 py-6 text-xs text-ink-faint sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Kaicho Foods. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-brand">
                {link.label}
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand transition-colors hover:bg-brand hover:text-white"
    >
      {children}
    </a>
  );
}
