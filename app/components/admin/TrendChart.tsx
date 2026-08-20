"use client";

import { useId } from "react";
import type { DashboardTrendPoint } from "@/lib/api/admin";

const WIDTH = 480;
const HEIGHT = 140;
const PADDING_Y = 12;

export default function TrendChart({ data }: { data: DashboardTrendPoint[] }) {
  const gradientId = useId();

  if (data.length === 0) return null;

  const values = data.map((d) => d.revenue);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * WIDTH;
    const y = HEIGHT - PADDING_Y - ((d.revenue - min) / range) * (HEIGHT - PADDING_Y * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-36 w-full"
      role="img"
      aria-label={`Revenue trend over the last ${data.length} days`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-admin-primary)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--color-admin-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Faint horizontal gridlines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          x2={WIDTH}
          y1={HEIGHT * f}
          y2={HEIGHT * f}
          className="stroke-black/[0.06] dark:stroke-white/[0.08]"
          strokeWidth="1"
        />
      ))}

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-admin-primary-dark)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:[stroke:var(--color-admin-primary)]"
      />

      {/* Emphasized endpoint */}
      <circle cx={last.x} cy={last.y} r="4" fill="var(--color-admin-primary-dark)" className="dark:[fill:var(--color-admin-primary)]" />
      <circle cx={last.x} cy={last.y} r="7" fill="var(--color-admin-primary-dark)" opacity="0.2" className="dark:[fill:var(--color-admin-primary)]" />
    </svg>
  );
}
