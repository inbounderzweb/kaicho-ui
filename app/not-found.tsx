import Button from "./components/ui/Button";
import Container from "./components/ui/Container";
import { IconArrowRight, IconLeaf } from "./components/ui/icons";
import { buildPageMetadata } from "@/lib/seo/metadata";

// Next.js automatically injects its own <meta name="robots" content="noindex">
// on any 404 response (documented behavior), on top of whatever this page's
// own metadata declares. Explicitly setting noIndex here is still correct:
// leaving `robots` unset would inherit the root layout's `index, follow`
// default via metadata inheritance, which would actively contradict Next's
// injected tag rather than just duplicate it. Two agreeing noindex tags is
// the best achievable outcome without giving up this page's own title.
export const metadata = buildPageMetadata({
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist or may have moved.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <section className="flex min-h-[calc(100dvh-5rem-4rem)] items-center justify-center bg-brand-soft/30 px-4 py-16 sm:min-h-[calc(100dvh-5rem)]">
      <Container className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20">
          <IconLeaf className="h-7 w-7" />
        </div>

        <p className="mt-6 font-display text-sm font-bold uppercase tracking-[0.2em] text-brand">
          404
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist or may have
          moved. Try heading back home or browsing our meals.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/" size="lg">
            Back to Home
            <IconArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/products" variant="outline" size="lg">
            View Products
          </Button>
        </div>
      </Container>
    </section>
  );
}
