const STEAM_PATH =
  "M0 40c6-10 -6-16 0-26 M14 40c6-10 -6-16 0-26 M28 40c6-10 -6-16 0-26";

export default function HeroArt({ accent }: { accent: string }) {
  return (
    <svg
      viewBox="0 0 480 480"
      className="h-full w-full"
      role="img"
      aria-label="Illustration of a Kaicho ready-to-eat pouch and a bowl of porridge"
    >
      <circle cx="240" cy="248" r="210" fill={accent} opacity="0.1" />
      <circle cx="240" cy="248" r="150" fill={accent} opacity="0.12" />

      {/* scattered grain dots */}
      <g fill={accent} opacity="0.55">
        <circle cx="88" cy="120" r="5" />
        <circle cx="106" cy="104" r="3.5" />
        <circle cx="70" cy="146" r="3" />
        <circle cx="392" cy="356" r="5" />
        <circle cx="410" cy="340" r="3.5" />
        <circle cx="378" cy="378" r="3" />
      </g>

      {/* pouch */}
      <g transform="translate(120 66)">
        <path
          d="M18 46 Q0 10 40 4 L140 4 Q180 10 162 46 L172 250 Q172 296 130 300 L50 300 Q8 296 8 250 Z"
          fill="#FFFFFF"
          stroke="#1C1C1C"
          strokeOpacity="0.08"
          strokeWidth="2"
        />
        <path d="M18 46 Q0 10 40 4 L140 4 Q180 10 162 46 Z" fill={accent} />
        <rect x="8" y="250" width="164" height="50" rx="25" fill={accent} opacity="0.16" />

        {/* label window */}
        <rect x="34" y="88" width="112" height="112" rx="16" fill="#F7F4EE" />
        <rect x="34" y="88" width="112" height="112" rx="16" fill="none" stroke={accent} strokeWidth="3" />
        <g transform="translate(50 150)">
          <path d="M0 0h80a40 22 0 0 1 -80 0Z" fill={accent} opacity="0.85" />
          <path d="M10 -10c4-6 -4-10 0-16M28 -10c4-6 -4-10 0-16M46 -10c4-6 -4-10 0-16" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
        <rect x="46" y="60" width="88" height="16" rx="8" fill="#1C1C1C" opacity="0.85" />
        <text x="90" y="72" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="var(--font-sans)">
          READY TO EAT
        </text>
      </g>

      {/* bowl */}
      <g transform="translate(232 300)">
        <ellipse cx="90" cy="112" rx="118" ry="24" fill="#1C1C1C" opacity="0.06" />
        <path d="M0 40h180a90 56 0 0 1 -180 0Z" fill="#FFFFFF" stroke="#1C1C1C" strokeOpacity="0.1" strokeWidth="2" />
        <path d="M14 40h152a76 40 0 0 1 -152 0Z" fill={accent} opacity="0.9" />
        <g fill="#FFFFFF" opacity="0.55">
          <circle cx="60" cy="52" r="3.5" />
          <circle cx="90" cy="60" r="3" />
          <circle cx="120" cy="50" r="3.5" />
          <circle cx="75" cy="66" r="2.5" />
          <circle cx="105" cy="68" r="2.5" />
        </g>
        <path
          d={STEAM_PATH}
          transform="translate(64 -36)"
          stroke={accent}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
