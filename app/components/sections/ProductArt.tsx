function Pouch({ accent, x = 0, scale = 1, opacity = 1 }: { accent: string; x?: number; scale?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} 0) scale(${scale})`} opacity={opacity}>
      <path
        d="M14 32 Q2 8 28 4 L92 4 Q118 8 106 32 L112 168 Q112 198 86 200 L34 200 Q8 198 8 168 Z"
        fill="#FFFFFF"
        stroke="#1C1C1C"
        strokeOpacity="0.08"
        strokeWidth="2"
      />
      <path d="M14 32 Q2 8 28 4 L92 4 Q118 8 106 32 Z" fill={accent} />
      <rect x="8" y="168" width="104" height="32" rx="16" fill={accent} opacity="0.16" />
      <rect x="22" y="60" width="76" height="76" rx="12" fill="#F7F4EE" stroke={accent} strokeWidth="2.5" />
      <path d="M32 108h56a28 15 0 0 1 -56 0Z" fill={accent} opacity="0.85" />
      <rect x="30" y="40" width="60" height="12" rx="6" fill="#1C1C1C" opacity="0.85" />
    </g>
  );
}

export default function ProductArt({ accent, count = 1 }: { accent: string; count?: 1 | 2 | 3 }) {
  const layout =
    count === 1
      ? [{ x: 60, scale: 1, opacity: 1 }]
      : count === 2
        ? [
            { x: 8, scale: 0.82, opacity: 0.85 },
            { x: 78, scale: 1, opacity: 1 },
          ]
        : [
            { x: -8, scale: 0.72, opacity: 0.7 },
            { x: 52, scale: 0.9, opacity: 0.9 },
            { x: 118, scale: 1, opacity: 1 },
          ];

  return (
    <svg viewBox="0 0 240 220" className="h-full w-full">
      <ellipse cx="120" cy="205" rx="90" ry="10" fill="#1C1C1C" opacity="0.05" />
      {layout.map((p, i) => (
        <Pouch key={i} accent={accent} x={p.x} scale={p.scale} opacity={p.opacity} />
      ))}
    </svg>
  );
}
