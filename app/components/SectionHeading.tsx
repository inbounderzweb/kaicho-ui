type Props = {
  eyebrow: string;
  heading: string;
  subheading?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = "center",
  tone = "light",
  className = "",
}: Props) {
  const alignClass = align === "center" ? "items-center text-center" : "items-start text-left";
  const headingColor = tone === "light" ? "text-ink" : "text-white";
  const subColor = tone === "light" ? "text-ink-muted" : "text-white/75";

  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
        {eyebrow}
      </span>
      <h2
        className={`mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl ${headingColor}`}
      >
        {heading}
      </h2>
      {subheading ? (
        <p className={`mt-3 max-w-xl text-base leading-relaxed ${subColor}`}>
          {subheading}
        </p>
      ) : null}
    </div>
  );
}
