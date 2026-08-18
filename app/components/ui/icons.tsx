import { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconLeaf(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 19c8-1 13-6 14-14C11 6 6 11 5 19Z" />
      <path d="M5 19c2-4 5-7 9-9" />
    </svg>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

export function IconBowl(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h18a9 6 0 0 1-18 0Z" />
      <path d="M8 12a4 4 0 0 1 8 0" />
      <path d="M12 4v2" />
    </svg>
  );
}

export function IconPackage(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z" />
      <path d="M4 7.5 12 11l8-3.5" />
      <path d="M12 11v9" />
    </svg>
  );
}

export function IconWheat(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21V9" />
      <path d="M12 9c-2-1-2-3 0-4 2 1 2 3 0 4Z" />
      <path d="M9 12c-2-1-2-3 0-4M15 12c2-1 2-3 0-4" />
      <path d="M9 16c-2-1-2-3 0-4M15 16c2-1 2-3 0-4" />
    </svg>
  );
}

export function IconPulse(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h4l2 6 4-14 2 8h6" />
    </svg>
  );
}

export function IconDropSlash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c3.5 4 6 7.2 6 10.2A6 6 0 0 1 6 13.2C6 10.2 8.5 7 12 3Z" />
      <path d="M5 5l14 14" />
    </svg>
  );
}

export function IconCart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20.5 8H6" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 4-6 7.5-6s6 2 7.5 6" />
    </svg>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20s-7-4.4-9.5-9A5.3 5.3 0 0 1 12 6a5.3 5.3 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9Z" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconWhatsapp(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5A9.5 9.5 0 0 0 3.6 17l-1.1 4.5 4.6-1.2A9.5 9.5 0 1 0 12 2.5Zm0 1.8a7.7 7.7 0 0 1 6.6 11.6l-.2.4.6 2.5-2.6-.7-.4.2A7.7 7.7 0 1 1 12 4.3Zm-3.6 3.9c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.1.7.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.6-.9-2.1-.2-.5-.4-.4-.6-.4Z" />
    </svg>
  );
}

export function IconMapPin(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 6.5 8 6 8-6" />
    </svg>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h3l1.5 4.5-2 1.6a12 12 0 0 0 6.4 6.4l1.6-2L21 15v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z" />
    </svg>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFacebook(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.6h2.6l.4-3H13.5V8.4c0-.9.2-1.5 1.5-1.5h1.6V4.2C16.3 4.1 15.3 4 14.2 4c-2.4 0-4 1.5-4 4.1v2.3H7.6v3h2.6V21h3.3Z" />
    </svg>
  );
}

export function IconTruck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7.5" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function IconThermometer(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" />
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </svg>
  );
}

export function IconSuitcase(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.8-3.3 3-5 6-5s5.2 1.7 6 5" />
      <circle cx="17.5" cy="9" r="2.3" />
      <path d="M16 12.3c2.3.4 3.7 1.9 4.3 4.2" />
    </svg>
  );
}

export function IconLaptop(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="5" width="16" height="10" rx="1.5" />
      <path d="M2 19h20l-1.8-3H3.8L2 19Z" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

export function IconFlame(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c1 3-3 4-3 7.5A3.5 3.5 0 0 0 12 14a3 3 0 0 0 3-3c1.5 1 2 2.6 2 4.2A5 5 0 0 1 12 21a5.5 5.5 0 0 1-5.5-5.5C6.5 10 9 9 12 3Z" />
    </svg>
  );
}

export function IconQuote(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M9.5 6.5C6 7.5 4 10 4 13.5S6.5 19 9.2 19c2 0 3.3-1.4 3.3-3.2 0-1.6-1.1-2.8-2.7-2.8-.3 0-.6 0-.8.1.2-1.6 1.6-3.2 3.5-3.8L11.4 6.5h-1.9Zm9 0C15 7.5 13 10 13 13.5S15.5 19 18.2 19c2 0 3.3-1.4 3.3-3.2 0-1.6-1.1-2.8-2.7-2.8-.3 0-.6 0-.8.1.2-1.6 1.6-3.2 3.5-3.8l-1.1-2.8h-1.9Z" />
    </svg>
  );
}

export function IconSprout(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 20h8" />
      <path d="M9 20v-2.5a3 3 0 0 1 3-3 3 3 0 0 1 3 3V20" />
      <path d="M12 14.5V8" />
      <path d="M12 9c-3 0-5-2-5-5 3 0 5 2 5 5Z" />
      <path d="M12 11c2.5 0 4.5-1.8 4.5-4.5-2.5 0-4.5 1.8-4.5 4.5Z" />
    </svg>
  );
}

export function IconStar(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.4l-5.9 3.1 1.3-6.6-4.9-4.5 6.6-.8L12 2.5Z" />
    </svg>
  );
}

export function IconGoogle(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.04 12.27c0-.82-.07-1.42-.22-2.05H12.24v3.72h6.19c-.12 1.03-.8 2.58-2.31 3.62l-.02.14 3.35 2.59.23.02c2.13-1.97 3.36-4.87 3.36-8.04Z"
      />
      <path
        fill="#34A853"
        d="M12.24 23.04c3.04 0 5.59-1 7.45-2.72l-3.55-2.75c-.95.66-2.23 1.13-3.9 1.13-2.98 0-5.5-1.97-6.4-4.69l-.13.01-3.48 2.69-.05.12c1.85 3.68 5.65 6.21 10.06 6.21Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.01a6.9 6.9 0 0 1-.37-2.24c0-.78.14-1.53.36-2.24l-.01-.15L2.3 6.64l-.11.05a11.5 11.5 0 0 0 0 10.36l3.65-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12.24 5.13c2.12 0 3.55.91 4.37 1.67l3.19-3.11C17.82 2.02 15.28 1 12.24 1 7.83 1 4.03 3.53 2.19 7.21l3.64 2.83c.91-2.72 3.43-4.91 6.41-4.91Z"
      />
    </svg>
  );
}

export function IconMessageCircle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4 8.3 8.3 0 0 1-3.9-.9L3 21l1.9-5.7a8.3 8.3 0 0 1-.9-3.9A8.4 8.4 0 0 1 12.5 3a8.4 8.4 0 0 1 8.5 8.5Z" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
