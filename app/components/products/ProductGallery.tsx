"use client";

import { useState } from "react";
import ProductArt from "../sections/ProductArt";

const VIEWS: { count: 1 | 2 | 3; label: string }[] = [
  { count: 1, label: "Single pack" },
  { count: 2, label: "Pair" },
  { count: 3, label: "Multi-pack" },
];

export default function ProductGallery({ accent }: { accent: string }) {
  const [active, setActive] = useState<1 | 2 | 3>(1);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream">
        <div className="h-full w-full p-8 sm:p-12">
          <ProductArt accent={accent} count={active} />
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
        {VIEWS.map(({ count, label }) => (
          <button
            key={count}
            type="button"
            aria-label={label}
            aria-pressed={active === count}
            onClick={() => setActive(count)}
            className={`h-20 w-20 shrink-0 rounded-2xl border-2 bg-cream p-3 transition-colors sm:h-24 sm:w-24 ${
              active === count ? "border-brand" : "border-transparent hover:border-border"
            }`}
          >
            <ProductArt accent={accent} count={count} />
          </button>
        ))}
      </div>
    </div>
  );
}
