import type { PublicProductInventory } from "@/lib/api/publicProducts";

// Informational only — the backend is authoritative for stock, and never
// exposes the exact quantity here except as the "Only N left" low-stock
// nudge it itself computed (see hydratePublicListItems/getPublicProductBySlug's
// `lowStock` flag). This component never does its own stock math.
export default function ProductAvailability({
  inventory,
  size = "md",
}: {
  inventory: PublicProductInventory;
  size?: "sm" | "md";
}) {
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  if (!inventory.inStock) {
    return <p className={`font-semibold text-sale ${textSize}`}>Out of stock</p>;
  }

  if (inventory.lowStock) {
    return (
      <p className={`font-semibold text-terracotta ${textSize}`}>
        Only {inventory.stockQuantity} left in stock
      </p>
    );
  }

  return <p className={`font-semibold text-brand ${textSize}`}>In stock</p>;
}
