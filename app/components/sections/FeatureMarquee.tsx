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
  { label: "High In Fiber & Protein", Icon: IconWheat },
  { label: "Japanese Retort Technology", Icon: IconPackage },
];

function Track() {
  return (
    <>
      {CLAIMS.map(({ label, Icon }) => (
        <span key={label} className="flex shrink-0 items-center gap-3 px-8 py-4 text-sm font-semibold text-white sm:text-base">
          <Icon className="h-5 w-5 shrink-0" />
          {label}
          <span className="ml-8 h-1.5 w-1.5 rounded-full bg-white/40" aria-hidden />
        </span>
      ))}
    </>
  );
}

export default function FeatureMarquee() {
  return (
    <div className="overflow-hidden bg-brand">
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <Track />
        <Track />
      </div>
    </div>
  );
}
