import {
  IconDropSlash,
  IconLeaf,
  IconPackage,
  IconPulse,
  IconShieldCheck,
  IconWheat,
} from "../icons";

const CLAIMS = [
  { label: "Diabetic-Friendly", Icon: IconDropSlash },
  { label: "Gut-Healthy Ingredients", Icon: IconPulse },
  { label: "No Preservatives", Icon: IconShieldCheck },
  { label: "100% Natural", Icon: IconLeaf },
  { label: "High in Fiber & Protein", Icon: IconWheat },
  { label: "Japanese Retort Technology", Icon: IconPackage },
];

export default function FeatureMarquee() {
  return (
    <div className="bg-forest">
      <div className="no-scrollbar mx-auto flex w-full max-w-[1320px] items-stretch gap-x-[clamp(1.25rem,3vw,2rem)] overflow-x-auto px-[clamp(1.25rem,3vw,2rem)] py-[clamp(0.9rem,1.8vw,1.5rem)] lg:justify-between lg:gap-x-4">
        {CLAIMS.map(({ label, Icon }, i) => (
          <div
            key={label}
            className={`flex shrink-0 items-center gap-3 px-1 ${
              i > 0 ? "sm:border-l sm:border-white/15 sm:pl-6" : ""
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 text-cream-deep">
              <Icon className="h-[15px] w-[15px]" strokeWidth={1.5} />
            </span>
            <span className="whitespace-nowrap text-[clamp(0.75rem,0.2vw_+_0.7rem,0.8125rem)] font-semibold tracking-wide text-cream-deep">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
