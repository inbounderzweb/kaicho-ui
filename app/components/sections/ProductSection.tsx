import Button from "../ui/Button";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { IconArrowRight } from "../ui/icons";
import ProductCard from "./ProductCard";
import { COMBOS, MEALS, SAVER_PACKS } from "./product-data";
import type { Product } from "./product-data";

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.name} {...product} />
      ))}
    </div>
  );
}

export default function ProductSection() {
  return (
    <section id="products" className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Products"
          heading="Ready to Eat Meals"
          subheading="Healthy, filling meals for busy lifestyles."
        />
        <div className="mt-12">
          <ProductGrid products={MEALS} />
        </div>

        <h3 className="mt-20 text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
          Ready to Eat Combos
        </h3>
        <div className="mt-10">
          <ProductGrid products={COMBOS} />
        </div>

        <h3 className="mt-20 text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
          Kaicho Family Saver Packs
        </h3>
        <div className="mt-10">
          <ProductGrid products={SAVER_PACKS} />
        </div>

        <div className="mt-14 flex justify-center">
          <Button href="#story" size="lg">
            Explore Our Meals
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Container>
    </section>
  );
}
