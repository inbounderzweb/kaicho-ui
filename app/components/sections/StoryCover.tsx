import Image from "next/image";
import Button from "../Button";
import Container from "../Container";

const HIGHLIGHTS = [
  {
    src: "/kaicho-hero.png",
    alt: "Kaicho Veg Oats Porridge pouch",
    label: "100% Natural",
    fit: "contain",
  },
  {
    src: "/kaicho-chickenoats.png",
    alt: "Bowl of Kaicho Chicken Oats Porridge",
    label: "No Preservatives",
    fit: "contain",
  },
  {
    src: "/kaicho-lifestyle-banner.jpg",
    alt: "Kaicho customer enjoying a bowl of porridge at home",
    label: "Ready to Eat",
    fit: "cover",
  },
] as const;

export default function StoryCover() {
  return (
    // bg-fixed pins the background to the viewport instead of the section,
    // so the page just scrolls normally over it (a plain parallax backdrop)
    // rather than the section itself pinning in place.
    <section className="relative flex min-h-[70vh] w-full items-center overflow-hidden bg-forest bg-[url('/mobile-coverimage.png')] bg-cover bg-center bg-fixed py-20 sm:py-24 md:bg-[url('/desktop-coverimage.png')]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-forest/70" />

      <Container className="relative flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <div className="max-w-md">
          <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Wholesome meals that care for you and your family.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
            Natural by nature.
            <br />
            Ready by choice.
          </p>
          <Button href="#story" variant="outline-light" size="lg" className="mt-8">
            Learn Our Story
          </Button>
        </div>

        <div className="flex flex-wrap items-end justify-center gap-5 sm:gap-8">
          {HIGHLIGHTS.map(({ src, alt, label, fit }) => (
            <div key={label} className="flex w-[26%] min-w-[92px] shrink-0 flex-col items-center gap-2 sm:w-32 lg:w-36">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 1024px) 144px, 28vw"
                  className={
                    fit === "cover"
                      ? "rounded-2xl object-cover shadow-[0_20px_45px_-15px_rgba(0,0,0,0.55)]"
                      : "object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)]"
                  }
                />
              </div>
              <p className="text-center text-xs font-semibold leading-tight text-white sm:text-sm">
                {label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
