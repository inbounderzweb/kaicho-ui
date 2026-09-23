export default function ProductPackDetails({ weightPerPackGrams, numberOfPacks }: {
  weightPerPackGrams?: number | null;
  numberOfPacks?: number | null;
}) {
  const details = [
    weightPerPackGrams != null && weightPerPackGrams > 0 ? `${weightPerPackGrams} g / pack` : null,
    numberOfPacks != null && numberOfPacks > 0 ? `${numberOfPacks} ${numberOfPacks === 1 ? "pack" : "packs"}` : null,
  ].filter(Boolean);
  if (!details.length) return null;
  return <p className="mt-1 text-xs leading-4 text-ink-muted">{details.join(" · ")}</p>;
}
