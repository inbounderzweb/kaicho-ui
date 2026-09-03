import Container from "../ui/Container";
import ProductCard from "../products/ProductCard";
import { fetchHomepageCollections, type AdminCollection } from "@/lib/api/collection";

async function loadCollections(): Promise<AdminCollection[]> {
  try {
    const { collections } = await fetchHomepageCollections({ revalidate: 120 });
    return collections;
  } catch {
    return [];
  }
}

export default async function CategoryShowcase() {
  const collections = await loadCollections();
  return (
    <section className="bg-white md:py-12 py-20 sm:py-24">
      <Container>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-terracotta">Full Menu</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-black sm:text-4xl">Shop by Collection</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-black/50">Homepage collections are managed from the admin dashboard and rendered dynamically.</p>
        </div>
        <div className="mt-14 flex flex-col gap-16 sm:mt-16">
          {collections.length ? collections.map((collection) => (
            <div key={collection.collectionId}>
              <div className="flex items-center gap-4">
                <h3 className="shrink-0 font-display text-xl font-bold text-black sm:text-2xl">{collection.name}</h3>
                <span className="h-px flex-1 bg-border" />
              </div>
              {collection.products?.length ? (
                <div className="no-scrollbar mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 sm:snap-none lg:grid-cols-4">
                  {collection.products.map((product) => (
                    <div key={product.productId} className="w-[68vw] max-w-65 shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-7 rounded-3xl border border-dashed border-border bg-cream/30 p-6 text-center">
                  <p className="font-display text-lg font-semibold text-black">Collection coming soon</p>
                  <p className="mt-2 text-sm text-black/60">
                    This collection is active, but no visible products have been assigned yet.
                  </p>
                </div>
              )}
            </div>
          )) : (
            <div className="rounded-3xl border border-dashed border-border bg-cream/40 p-8 text-center">
              <p className="font-display text-xl font-semibold text-black">No active collections yet.</p>
              <p className="mt-2 text-sm text-black/60">Create and activate collections in admin to show them here.</p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
