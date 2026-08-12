export default function WholesomeArt() {
  return (
    <svg viewBox="0 0 480 360" className="h-full w-full" role="img" aria-label="Bowl of Kaicho porridge garnished with grains and leaves">
      <rect width="480" height="360" fill="#0B2015" />
      <circle cx="120" cy="70" r="90" fill="#173B27" opacity="0.6" />
      <circle cx="420" cy="300" r="110" fill="#173B27" opacity="0.5" />

      {/* scattered grains */}
      <g fill="#C9A24A" opacity="0.85">
        <circle cx="70" cy="290" r="6" />
        <circle cx="94" cy="308" r="4" />
        <circle cx="54" cy="316" r="3.5" />
        <circle cx="112" cy="286" r="3" />
        <circle cx="410" cy="70" r="5" />
        <circle cx="430" cy="90" r="3.5" />
        <circle cx="392" cy="94" r="3" />
      </g>

      {/* bowl */}
      <g transform="translate(110 108)">
        <ellipse cx="130" cy="170" rx="150" ry="26" fill="#000000" opacity="0.35" />
        <path d="M0 60h260a130 82 0 0 1 -260 0Z" fill="#F7F4EE" />
        <path d="M14 60h232a112 66 0 0 1 -232 0Z" fill="#8A6D3B" />
        <g fill="#EFE0BC" opacity="0.7">
          <circle cx="70" cy="76" r="4.5" />
          <circle cx="110" cy="90" r="4" />
          <circle cx="150" cy="74" r="4.5" />
          <circle cx="190" cy="88" r="3.5" />
          <circle cx="95" cy="100" r="3" />
          <circle cx="170" cy="102" r="3" />
        </g>
        <path
          d="M60 8c8-14 -8-22 0-38M100 8c8-14 -8-22 0-38M140 8c8-14 -8-22 0-38M180 8c8-14 -8-22 0-38"
          stroke="#C9A24A"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.45"
        />
      </g>

      {/* leaf garnish */}
      <g transform="translate(300 150) rotate(18)">
        <path d="M0 40C-3 18 10 2 30 0c3 19-8 34-30 40Z" fill="#4E7A3C" />
        <path d="M0 40C13 26 21 12 26 2" stroke="#2E4A22" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
      <g transform="translate(150 250) rotate(-24) scale(0.8)">
        <path d="M0 40C-3 18 10 2 30 0c3 19-8 34-30 40Z" fill="#5B8C46" />
        <path d="M0 40C13 26 21 12 26 2" stroke="#2E4A22" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
